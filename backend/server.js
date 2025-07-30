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

const groupBy = (array, keyFn) => {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    result[key] = result[key] || [];
    result[key].push(item);
    return result;
  }, {});
};

app.get("/api/chart-data", async (req, res) => {
  try {
    const rawLogs = await redis.lRange("logs", -5000, -1); // 1000 записей

    const parsed = rawLogs.map(line => {
      const match = line.match(/^\[(.*?)\] Authserver status: (🟢|🔴) (UP|DOWN)/);
      if (!match) return null;

      const timestamp = new Date(match[1]);
      return {
        hour: timestamp.toISOString().slice(0, 13), // YYYY-MM-DDTHH
        status: match[3], // UP или DOWN
      };
    }).filter(Boolean);

    const grouped = groupBy(parsed, item => item.hour);

    const chartData = Object.entries(grouped).map(([hour, entries]) => {
      const ups = entries.filter(e => e.status === "UP").length;
      const downs = entries.length - ups;
      return {
        time: hour.replace("T", " "), // более читабельно
        statusValue: ups >= downs ? 1 : 0,
      };
    });

    res.json(chartData.reverse());
  } catch (e) {
    console.error("Ошибка агрегации графика:", e);
    res.status(500).json({ error: "Failed to get chart data." });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Сервер API запущен на http://localhost:${PORT}`)
);
