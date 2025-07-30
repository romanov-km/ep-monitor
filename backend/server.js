const express = require("express");
const cors = require("cors");
const { createClient } = require("redis");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL не задан в переменных среды!");
  process.exit(1);
}

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch((err) => {
  console.error("❌ Ошибка подключения к Redis:", err);
  process.exit(1);
});

app.get("/api/health", async (req, res) => {
  try {
    await redis.ping();
    res.status(200).send("🟢 OK");
  } catch (e) {
    res.status(500).send("🔴 Redis недоступен");
  }
});

app.use(cors());

app.get("/api/status", async (req, res) => {
  try {
    const lines = await redis.lRange("logs", -1000, -1);
    const parsed = lines
      .reverse()
      .map(line => {
        const [time, ...rest] = line.split(" ");
        return {
          time: time.replace("[", "").replace("]", ""),
          status: rest.join(" ")
        };
      });
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: "Can't read logs from Redis." });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Сервер API запущен на http://localhost:${PORT}`)
);
