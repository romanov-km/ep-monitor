import { WebSocketServer } from "ws";
import { createServer } from "http";
import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

// Конфигурация
const PORT = process.env.WS_PORT || 8080;
const HISTORY_LIMIT = 100;
const NAME_RESERVE_TIME = 5000; // 15 секунд
const PING_INTERVAL = 30000; // 30 секунд

const server = createServer();
const wss = new WebSocketServer({ server });

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

const realmClients = new Map(); // realm → Set<WebSocket>
const usernames = new Map(); // WebSocket → username
const reservedNames = new Map(); // username → expiryTime

// Очистка устаревших резервов имён
setInterval(() => {
  const now = Date.now();
  for (const [name, expiry] of reservedNames.entries()) {
    if (expiry <= now) reservedNames.delete(name);
  }
}, 60000);

// Удаление клиента из всех структур
function cleanup(ws) {
  const { realm, username } = ws;
  
  if (username) {
    usernames.delete(ws);
    reserveName(username);
  }
  
  if (realm && realmClients.has(realm)) {
    const clients = realmClients.get(realm);
    clients.delete(ws);
    
    if (clients.size === 0) {
      realmClients.delete(realm);
    }
    
    broadcastUserCount(realm);
    broadcastOnlineUsers(realm);
  }
}

// Проверка доступности имени
function isNameAvailable(realm, username) {
  if (isReserved(username)) return false;
  
  const clients = realmClients.get(realm);
  if (!clients) return true;
  
  return ![...clients].some(client => client.username === username);
}

function isReserved(username) {
  const expiry = reservedNames.get(username);
  return expiry && Date.now() < expiry;
}

function reserveName(username) {
  reservedNames.set(username, Date.now() + NAME_RESERVE_TIME);
}

// Рассылка данных клиентам реалма
function broadcastUserCount(realm) {
  const count = realmClients.get(realm)?.size || 0;
  const message = JSON.stringify({ type: "user_count", count });
  
  realmClients.get(realm)?.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

function broadcastOnlineUsers(realm) {
  const clients = realmClients.get(realm);
  if (!clients) return;
  
  const users = [...new Set(
    [...clients]
      .filter(c => c.username)
      .map(c => c.username)
  )];
  
  const message = JSON.stringify({ type: "online_users", users });
  
  clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

// Обработка подключений
wss.on('connection', (ws) => {
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      
      // Обработка ping/pong
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      
      // Подписка на реалм
      if (data.type === 'subscribe') {
        cleanup(ws); // Очистка предыдущего состояния
        
        const { realm, username } = data;
        
        // Валидация данных
        if (!realm || !username || 
            typeof realm !== 'string' || 
            typeof username !== 'string') {
          ws.close(4000, "Invalid subscription data");
          return;
        }
        
        // Проверка имени
        if (!isNameAvailable(realm, username)) {
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "Username is not available" 
          }));
          ws.close(4001, "Username not available");
          return;
        }
        
        // Регистрация клиента
        ws.realm = realm;
        ws.username = username;
        usernames.set(ws, username);
        
        if (!realmClients.has(realm)) {
          realmClients.set(realm, new Set());
        }
        realmClients.get(realm).add(ws);
        
        // Отправка истории
        try {
          const raw = await redisClient.lRange(`chat:${realm}`, 0, HISTORY_LIMIT - 1);
          const entries = raw.reverse().map(JSON.parse);
          ws.send(JSON.stringify({ type: 'history', entries }));
        } catch (err) {
          console.error("Redis history error:", err);
        }
        
        // Обновление онлайн-статуса
        broadcastUserCount(realm);
        broadcastOnlineUsers(realm);
        return;
      }
      
      // Отправка сообщения
      if (data.type === 'message') {
        if (!ws.realm || !ws.username) {
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "Subscribe first" 
          }));
          return;
        }
        
        const { text } = data;
        if (!text || typeof text !== 'string') return;
        
        const entry = {
          time: new Date().toISOString(),
          realm: ws.realm,
          user: ws.username,
          text: text.slice(0, 500), // Ограничение длины
        };
        
        try {
          await redisClient.lPush(`chat:${ws.realm}`, JSON.stringify(entry));
          await redisClient.lTrim(`chat:${ws.realm}`, 0, HISTORY_LIMIT - 1);
          
          const message = JSON.stringify({ type: 'new_message', entry });
          
          realmClients.get(ws.realm)?.forEach(client => {
            if (client.readyState === 1) client.send(message);
          });
        } catch (err) {
          console.error("Redis message error:", err);
        }
        return;
      }
      
      // Неизвестный тип сообщения
      ws.send(JSON.stringify({ 
        type: "error", 
        message: "Unknown message type" 
      }));
      
    } catch (e) {
      console.error('Message processing error:', e);
      ws.close(4002, "Invalid message format");
    }
  });

  const onClose = () => {
    cleanup(ws);
    console.log(`Client disconnected: ${ws.username || 'unknown'}`);
  };
  
  ws.on('close', onClose);
  ws.on('error', onClose);
});

// Проверка активности клиентов
const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, PING_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
  redisClient.quit();
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket server running on port ${PORT}`);
});