import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.WS_PORT || 8080;
const server = createServer();
const wss = new WebSocketServer({ server });

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

const realmClients = new Map();
const usernames = new Map();
const busyNames = new Set();

// Heartbeat механизм
const clientHeartbeats = new Map();
const HEARTBEAT_INTERVAL = 30000; // 30 секунд
const HEARTBEAT_TIMEOUT = 45000; // 45 секунд - клиент должен ответить в течение 15 секунд

// Дебаунс для логов отключений
const disconnectLogs = new Map();
const LOG_DEBOUNCE_TIME = 5000; // 5 секунд

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('🛑 Начинаем graceful shutdown...');
  isShuttingDown = true;
  
  // Закрываем все WebSocket соединения
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1000, 'Server shutdown');
    }
  });
  
  // Ждем закрытия всех соединений
  await new Promise((resolve) => {
    wss.close(() => {
      console.log('✅ WebSocket сервер закрыт');
      resolve();
    });
  });
  
  // Закрываем Redis соединение
  await redisClient.quit();
  console.log('✅ Redis соединение закрыто');
  
  // Закрываем HTTP сервер
  server.close(() => {
    console.log('✅ HTTP сервер закрыт');
    process.exit(0);
  });
  
  // Принудительный выход через 10 секунд
  setTimeout(() => {
    console.log('⚠️ Принудительное завершение');
    process.exit(1);
  }, 10000);
}

// Функция для установки heartbeat для клиента
function setupHeartbeat(ws) {
  const heartbeatId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "heartbeat" }));
      
      // Устанавливаем таймаут для ответа
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Heartbeat timeout для ${usernames.get(ws) || 'unknown'}`);
        ws.close(1000, 'Heartbeat timeout');
      }, HEARTBEAT_TIMEOUT - HEARTBEAT_INTERVAL);
      
      // Сохраняем timeout ID для очистки при получении pong
      ws.heartbeatTimeoutId = timeoutId;
    }
  }, HEARTBEAT_INTERVAL);
  
  clientHeartbeats.set(ws, heartbeatId);
}

// Функция для очистки heartbeat
function clearHeartbeat(ws) {
  const heartbeatId = clientHeartbeats.get(ws);
  if (heartbeatId) {
    clearInterval(heartbeatId);
    clientHeartbeats.delete(ws);
  }
  
  if (ws.heartbeatTimeoutId) {
    clearTimeout(ws.heartbeatTimeoutId);
    ws.heartbeatTimeoutId = null;
  }
}

wss.on("connection", (ws) => {
  console.log("🔌 Новое подключение");
  
  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }

      if (data.type === "pong") {
        // Клиент ответил на heartbeat - очищаем timeout
        if (ws.heartbeatTimeoutId) {
          clearTimeout(ws.heartbeatTimeoutId);
          ws.heartbeatTimeoutId = null;
        }
        return;
      }

      if (data.type === "subscribe") {
        const realm = data.realm;
        const username = data.username;

        if (busyNames.has(username)) {
          ws.send(JSON.stringify({
            type: "error",
            code: "duplicate_nick",
            message: "You have been disconnected: duplicate nickname.",
          }));
          ws.close();
          return;
        }

        ws.realm = realm;
        ws.username = username;
       

        // Регистрируем новый сокет
        busyNames.add(username);
        usernames.set(ws, username);

        // Добавляем клиента в список
        if (!realmClients.has(realm)) {
          realmClients.set(realm, new Set());
        }
        realmClients.get(realm).add(ws);

        // Отправляем подтверждение успешной подписки
        ws.send(JSON.stringify({ type: "subscribe_success" }));
        console.log(`✅ Пользователь ${username} подключился к чату ${realm}`);

        // Запускаем heartbeat для этого клиента
        setupHeartbeat(ws);

        // Отправляем историю
        const raw = await redisClient.lRange(`chat:${realm}`, 0, 49);
        const entries = raw.reverse().map((line) => JSON.parse(line));

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "history", entries }));
        }

        // Рассылаем обновлённый онлайн
        broadcastUserCount(realm);
        broadcastOnlineUsers(realm);
        return;
      }

      // Новое сообщение
      const { realm, user, text } = data;
      if (!realm || !user || !text) return;

      const entry = {
        time: new Date().toISOString(),
        realm,
        user,
        text,
      };

      await redisClient.lPush(`chat:${realm}`, JSON.stringify(entry));
      await redisClient.lTrim(`chat:${realm}`, 0, 99);

      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.realm === realm) {
          client.send(JSON.stringify({ type: "new_message", entry }));
        }
      });
    } catch (e) {
      console.error("Ошибка обработки сообщения:", e);
    }
  });

  ws.on("close", (code, reason) => {
    const realm = ws.realm;
    const name  = usernames.get(ws);
    
    // Очищаем heartbeat
    clearHeartbeat(ws);
    
    usernames.delete(ws);
    if (name) busyNames.delete(name);

    if (realm && realmClients.has(realm)) {
      realmClients.get(realm).delete(ws);
      broadcastUserCount(realm);
      broadcastOnlineUsers(realm);
    }
    
    // Логируем только если был зарегистрированный пользователь с дебаунсом
    if (name) {
      const now = Date.now();
      const lastLog = disconnectLogs.get(name);
      
      if (!lastLog || (now - lastLog) > LOG_DEBOUNCE_TIME) {
        console.log(`Клиент отключился: ${name} (код: ${code}, причина: ${reason || 'не указана'})`);
        disconnectLogs.set(name, now);
      }
    }
  });

  ws.on("error", (error) => {
    const realm = ws.realm;
    const name  = usernames.get(ws);
    
    // Очищаем heartbeat
    clearHeartbeat(ws);
    
    usernames.delete(ws);
    if (name) busyNames.delete(name);

    if (realm && realmClients.has(realm)) {
      realmClients.get(realm).delete(ws);
      broadcastUserCount(realm);
      broadcastOnlineUsers(realm);
    }
    
    // Логируем только если был зарегистрированный пользователь с дебаунсом
    if (name) {
      const now = Date.now();
      const lastLog = disconnectLogs.get(name);
      
      if (!lastLog || (now - lastLog) > LOG_DEBOUNCE_TIME) {
        console.log(`Клиент отключился с ошибкой: ${name} - ${error.message}`);
        disconnectLogs.set(name, now);
      }
    }
  });
});

// Рассылка количества пользователей в чате
function broadcastUserCount(realm) {
  const count = realmClients.get(realm)?.size || 0;
  realmClients.get(realm)?.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "user_count", count }));
    }
  });
}
// Чатерсы в чате имена
function broadcastOnlineUsers(realm) {
  const clients = realmClients.get(realm);

  if (!clients) return;

  const users = [...new Set([...clients].map((c) => c.username))];

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "online_users", users }));
    }
  });
}

// Периодическая очистка мертвых соединений
setInterval(() => {
  if (isShuttingDown) return; // Не очищаем во время shutdown
  
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      const name = usernames.get(client);
      if (name) {
        clearHeartbeat(client);
        busyNames.delete(name);
        usernames.delete(client);
        console.log(`🧹 Очищен зависший ник: ${name}`);
      }
    }
  });
}, 30000); // Проверяем каждые 30 секунд

server.listen(PORT, () => {
  console.log(`✅ WebSocket сервер запущен на порту ${PORT}`);
});
