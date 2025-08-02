import { WebSocketServer } from "ws";
import { createServer } from "http";
import redis from "redis";
import dotenv from "dotenv";


dotenv.config();

const PORT = process.env.WS_PORT || 8080;
const server = createServer();
const wss = new WebSocketServer({ server });

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

/** @type {Map<string, Set<WebSocket>>} */
const realmClients = new Map();
/** @type {Map<WebSocket, string>} */
const usernames = new Map();

wss.on('connection', (ws) => {
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (data.type === 'subscribe') {
        const realm = data.realm;
        const username = data.username;
        ws.realm = realm;
        ws.username = username;
        usernames.set(ws, username);

        // Проверка на дублирующийся ник
        const existingUsers = [...usernames.values()];
          if (existingUsers.includes(username)) {
          ws.send(JSON.stringify({ type: "error", message: "Username is already taken." }));
          ws.close(); // Закрываем соединение
          return;
        }
        // Добавляем клиента в список
        if (!realmClients.has(realm)) {
          realmClients.set(realm, new Set());
        }
        realmClients.get(realm).add(ws);

        // Отправляем историю
        const raw = await redisClient.lRange(`chat:${realm}`, 0, 49);
        const entries = raw.reverse().map((line) => JSON.parse(line));
        ws.send(JSON.stringify({ type: 'history', entries }));

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
          client.send(JSON.stringify({ type: 'new_message', entry }));
        }
      });
    } catch (e) {
      console.error('Ошибка обработки сообщения:', e);
    }
  });

  ws.on('close', () => {
    const realm = ws.realm;
    usernames.delete(ws);
    if (realm && realmClients.has(realm)) {
      realmClients.get(realm).delete(ws);
      broadcastUserCount(realm);
      broadcastOnlineUsers(realm);
    }
    console.log("Клиент отключился");
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

  const users = [...clients]
    .filter(c => c.username)
    .map(c => c.username);

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "online_users", users }));
    }
  });
}

server.listen(PORT, () => {
  console.log(`✅ WebSocket сервер запущен на порту ${PORT}`);
});
