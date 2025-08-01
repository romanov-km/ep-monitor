import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.WS_PORT || 8080;
const server = createServer();
const wss = new WebSocketServer({ server });

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

wss.on('connection', (ws, req) => {
  let currentRealm = null;

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
  
      // 1. Подписка на реалм и отправка истории
      if (data.type === 'subscribe') {
        ws.realm = data.realm;
        console.log(`Клиент подписался на ${data.realm}`);
  
        const raw = await redisClient.lRange(`chat:${data.realm}`, 0, 49);
        const entries = raw.reverse().map((line) => JSON.parse(line));
  
        ws.send(JSON.stringify({ type: 'history', entries }));
        return;
      }
  
      // 2. Новое сообщение
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
    console.log('Клиент отключился');
  });

});

server.listen(PORT, () => {
  console.log(`✅ WebSocket сервер запущен на порту ${PORT}`);
});
