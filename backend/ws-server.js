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

// Защита от DDoS атак
const connectionAttempts = new Map(); // IP -> { count, firstAttempt }
const MAX_CONNECTIONS_PER_IP = 20; // Максимум 20 подключений с одного IP (было 5)
const CONNECTION_WINDOW = 60000; // За 1 минуту
const MAX_CONNECTION_RATE = 50; // Максимум 50 попыток подключения в минуту (было 10)
const ENABLE_DDOS_PROTECTION = process.env.ENABLE_DDOS_PROTECTION !== "false"; // Можно отключить через env

// Heartbeat механизм
const clientHeartbeats = new Map();
const HEARTBEAT_INTERVAL = 60000; // 30 секунд (было 60) - Railway edge-прокси закрывает через ~60с

// Дебаунс для логов отключений
const disconnectLogs = new Map();
const LOG_DEBOUNCE_TIME = 5000; // 5 секунд

// Graceful shutdown
let isShuttingDown = false;

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

const blockedIPs = [""];

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

function removeClient(ws) {
  const realm = ws.realm;
  const name = usernames.get(ws);

  clearHeartbeat(ws);
  usernames.delete(ws);

  if (realm && realmClients.has(realm)) {
    realmClients.get(realm).delete(ws);
    broadcastUserCount(realm);
    broadcastOnlineUsers(realm);
  }

  //чатерс вышел
  realmClients.get(realm).forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ 
        type: "user_left", 
        user: name 
      }));
    }
  });

  if (name) {
    const now = Date.now();
    const lastLog = disconnectLogs.get(name);
    if (!lastLog || now - lastLog > LOG_DEBOUNCE_TIME) {
      console.log(`Клиент отключился: ${name}`);
      disconnectLogs.set(name, now);
    }
  }
}

// Функция для получения IP адреса из HTTP запроса
function getClientIP(req) {
  // 1. Берём X-Forwarded-For, если есть (Railway пишет клиента последним)
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    // Railway пишет клиента последним ⇒ берём right-most
    return xff.split(",").pop().trim();
  }

  // 2. Fallback – X-Real-IP
  const xri = req.headers["x-real-ip"];
  if (xri) return xri.trim();

  // 3. Совсем крайний случай – адрес прокси
  return req.socket.remoteAddress ?? "unknown";
}

async function gracefulShutdown() {
  console.log("🛑 Начинаем graceful shutdown...");
  isShuttingDown = true;

  // Закрываем все WebSocket соединения
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1000, "Server shutdown");
    }
  });

  // Ждем закрытия всех соединений
  await new Promise((resolve) => {
    wss.close(() => {
      console.log("✅ WebSocket сервер закрыт");
      resolve();
    });
  });

  // Закрываем Redis соединение
  await redisClient.quit();
  console.log("✅ Redis соединение закрыто");

  // Закрываем HTTP сервер
  server.close(() => {
    console.log("✅ HTTP сервер закрыт");
    process.exit(0);
  });

  // Принудительный выход через 10 секунд
  setTimeout(() => {
    console.log("⚠️ Принудительное завершение");
    process.exit(1);
  }, 10000);
}

// Функция для установки heartbeat для клиента
function setupHeartbeat(ws) {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  const heartbeatId = setInterval(() => {
    if (ws.isAlive === false) {
      console.log(`[HEARTBEAT] Terminating ws for ${ws.username} (${ws.clientIP}) — no pong`);
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL);
  clientHeartbeats.set(ws, heartbeatId);
}

// Функция для очистки heartbeat
function clearHeartbeat(ws) {
  ws.isAlive = false;
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

wss.on("connection", async (ws, req) => {
  const clientIP = getClientIP(req);
  console.log(`🔌 Новое подключение с IP: ${clientIP}`);

  if (blockedIPs.includes(clientIP)) {
    ws.close(4001, "IP заблокирован сервером");
    console.log(`❌ Блокировано подключение с IP: ${clientIP}`);
    return;
  }

  // Сохраняем IP в объекте соединения для дальнейшего использования
  ws.clientIP = clientIP;

  // Проверяем DDoS защиту только если включена
  if (ENABLE_DDOS_PROTECTION) {
    const now = Date.now();
    const attempts = connectionAttempts.get(clientIP) || {
      count: 0,
      firstAttempt: now,
    };

    // Сбрасываем счетчик если прошло больше минуты
    if (now - attempts.firstAttempt > CONNECTION_WINDOW) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    attempts.count++;
    connectionAttempts.set(clientIP, attempts);

    // Проверяем лимиты
    if (attempts.count > MAX_CONNECTION_RATE) {
      console.log(
        `🚫 DDoS protection: Too many connection attempts from ${clientIP} (${
          attempts.count
        } in ${Math.round((now - attempts.firstAttempt) / 1000)}s)`
      );
      ws.close(1008, "Rate limit exceeded");
      return;
    }

    // Подсчитываем активные соединения с этого IP
    let activeConnectionsFromIP = 0;
    wss.clients.forEach((client) => {
      if (
        client.clientIP === clientIP &&
        client.readyState === WebSocket.OPEN
      ) {
        activeConnectionsFromIP++;
      }
    });

    if (activeConnectionsFromIP >= MAX_CONNECTIONS_PER_IP) {
      console.log(
        `🚫 DDoS protection: Too many active connections from ${clientIP} (${activeConnectionsFromIP})`
      );
      ws.close(1008, "Too many connections");
      return;
    }

    // Добавляем небольшую задержку при подозрительной активности
    if (attempts.count > MAX_CONNECTION_RATE * 0.7) {
      console.log(
        `⚠️ Rate limiting: Adding delay for ${clientIP} (${attempts.count} attempts)`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 секунда задержки
    }
  }

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "subscribe") {
        const realm = data.realm;
        const username = data.username;
        const sessionId = data.sessionId || null;

        // Проверяем валидность данных
        if (!username || username.trim() === "") {
          // Убираем детальное логирование для уменьшения спама
          ws.send(
            JSON.stringify({
              type: "error",
              code: "invalid_username",
              message: "Username is required.",
            })
          );
          ws.close();
          return;
        }

        // Дополнительная защита от ботов - проверяем длину и символы username
        if (username.length < 1 || username.length > 200) {
          console.log(
            `🚫 Bot protection: Invalid username length from IP ${ws.clientIP}: "${username}"`
          );
          ws.send(
            JSON.stringify({
              type: "error",
              code: "invalid_username",
              message: "Username must be 1-200 characters long.",
            })
          );
          ws.close();
          return;
        }

        // //Проверяем защиту от частых переподключений
        // const now = Date.now();
        // const lastConnection = recentConnections.get(username);
        // if (lastConnection && (now - lastConnection) < CONNECTION_COOLDOWN) {
        //   console.log(`🚫 Blocking rapid reconnection for ${username} (${now - lastConnection}ms since last)`);
        //   ws.send(JSON.stringify({
        //     type: "error",
        //     code: "rapid_reconnect",
        //     message: "Please wait before reconnecting.",
        //   }));
        //   ws.close();
        //   return;
        // }
        // recentConnections.set(username, now);

        ws.realm = realm;
        ws.username = username;

        // Регистрируем новый сокет
        // busyNames.add(username);
        usernames.set(ws, username);

        // Добавляем клиента в список
        if (!realmClients.has(realm)) {
          realmClients.set(realm, new Set());
        }
        realmClients.get(realm).add(ws);

        // Отправляем подтверждение успешной подписки
        ws.send(JSON.stringify({ type: "subscribe_success" }));
    
        console.log(
          `✅ Пользователь ${username} подключился к чату ${realm} ${clientIP}`
        );

        //новый чатерс зашел в чат отправили месагу клиенту
        realmClients.get(realm).forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ 
              type: "user_joined", 
              user: username 
            }));
          }
        });

        ws.sessionId = sessionId;
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
    removeClient(ws)
    console.log(
    `[CLOSE] ${ws.username || "unknown"} (${ws.clientIP || "-"}) — code: ${code}, reason: ${reason}`
  );
  });

  ws.on("error", (error) => {
    console.error(`[ERROR] ws for ${ws.username} (${ws.clientIP}):`, error);
  });
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket сервер запущен на порту ${PORT}`);
  console.log(
    `🛡️ DDoS protection: ${ENABLE_DDOS_PROTECTION ? "ENABLED" : "DISABLED"}`
  );
  if (ENABLE_DDOS_PROTECTION) {
    console.log(`   - Max connections per IP: ${MAX_CONNECTIONS_PER_IP}`);
    console.log(`   - Max connection rate: ${MAX_CONNECTION_RATE} per minute`);
  }
});
