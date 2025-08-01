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
    const rawLogs = await redis.lRange("logs", -5000, -1);

    const parsed = rawLogs.map(line => {
      const match = line.match(/^\[(.*?)\] Authserver status: (🟢|🔴) (UP|DOWN)/);
      if (!match) return null;

      const timestamp = new Date(match[1]);
      return {
        hour: timestamp.toISOString().slice(0, 13), // YYYY-MM-DDTHH
        status: match[3],
      };
    }).filter(Boolean);

    const grouped = groupBy(parsed, item => item.hour);

    const chartData = Object.entries(grouped).map(([hour, entries]) => {
      const ups = entries.filter(e => e.status === "UP").length;
      const downs = entries.filter(e => e.status === "DOWN").length;
      const total = ups + downs;

      const ratio = total > 0 ? ups / total : 0;

      return {
        time: hour.replace("T", " "),
        statusValue: +ratio.toFixed(2), // например: 0.67, 1, 0
      };
    });

    res.json(chartData.reverse());
  } catch (e) {
    console.error("Ошибка агрегации графика:", e);
    res.status(500).json({ error: "Failed to get chart data." });
  }
});

app.get("/api/realm-chart", async (req, res) => {
  try {
    const realms = ["Kezan_PVE", "Gurubashi_PVP"];
    const result = {};

    for (const realmKey of realms) {
      const rawLogs = await redis.lRange(`logs:${realmKey}`, -500, -1);

      const parsed = rawLogs.map(line => {
        const match = line.match(/^\[(.*?)\] Realm (.*) status: (🟢|🔴) (UP|DOWN)/);
        if (!match) return null;

        const timestamp = new Date(match[1]);
        return {
          hour: timestamp.toISOString().slice(0, 13), // YYYY-MM-DDTHH
          status: match[4], // UP or DOWN
        };
      }).filter(Boolean);

      const groupedByHour = groupBy(parsed, item => item.hour);

      const chartPoints = Object.entries(groupedByHour).map(([hour, logs]) => {
        const ups = logs.filter(l => l.status === "UP").length;
        const downs = logs.length - ups;
        return {
          time: hour.replace("T", " "),
          statusValue: ups >= downs ? 1 : 0,
        };
      });

      result[realmKey.replace("_", " ")] = chartPoints.reverse();
    }

    res.json(result);
  } catch (e) {
    console.error("Ошибка realm-графика:", e);
    res.status(500).json({ error: "Failed to get realm chart data." });
  }
});


app.get("/api/realm-status", async (req, res) => {
  try {
    // список реалмов (можно вынести в .env или в Redis позже)
    const realms = [
      "Kezan_PVE",
      "Gurubashi_PVP"
    ];

    const statuses = [];

    for (const realmKey of realms) {
      const logs = await redis.lRange(`logs:${realmKey}`, 0, 0); // только последний лог
      if (!logs.length) continue;

      const line = logs[0];
      const match = line.match(/^\[(.*?)\] Realm (.*) status: (🟢|🔴) (UP|DOWN)/);
      if (!match) continue;

      const [, time, name, icon, status] = match;

      statuses.push({
        name,
        time,
        icon,
        status,
      });
    }

    res.json(statuses);
  } catch (err) {
    console.error("Ошибка /api/realm-status:", err);
    res.status(500).json({ error: "Failed to get realm statuses" });
  }
});


app.listen(PORT, () =>
  console.log(`🚀 Сервер API запущен на http://localhost:${PORT}`)
);
