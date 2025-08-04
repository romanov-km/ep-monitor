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

wss.on("connection", (ws) => {
  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
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
    
    usernames.delete(ws);
    if (name) busyNames.delete(name);

    if (realm && realmClients.has(realm)) {
      realmClients.get(realm).delete(ws);
      broadcastUserCount(realm);
      broadcastOnlineUsers(realm);
    }
    
    // Логируем только если был зарегистрированный пользователь
    if (name) {
      console.log(`Клиент отключился: ${name} (код: ${code}, причина: ${reason || 'не указана'})`);
    }
  });

  ws.on("error", (error) => {
    const realm = ws.realm;
    const name  = usernames.get(ws);
    
    usernames.delete(ws);
    if (name) busyNames.delete(name);

    if (realm && realmClients.has(realm)) {
      realmClients.get(realm).delete(ws);
      broadcastUserCount(realm);
      broadcastOnlineUsers(realm);
    }
    
    // Логируем только если был зарегистрированный пользователь
    if (name) {
      console.log(`Клиент отключился с ошибкой: ${name} - ${error.message}`);
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
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      const name = usernames.get(client);
      if (name) {
        busyNames.delete(name);
        usernames.delete(client);
        console.log(`Очищен зависший ник: ${name}`);
      }
    }
  });
}, 30000); // Проверяем каждые 30 секунд

server.listen(PORT, () => {
  console.log(`✅ WebSocket сервер запущен на порту ${PORT}`);
});
