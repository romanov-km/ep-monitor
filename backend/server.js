import express from "express";
import cors from "cors";
import { createClient } from "redis";
import dotenv from "dotenv";
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DA_API_URL = "https://www.donationalerts.com/api/v1/alerts/donations";
const ACCESS_TOKEN = process.env.DA_ACCESS_TOKEN;
// === Discord last messages (JS) ===
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

app.use(cors());

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch((err) => {
  console.error("❌ Ошибка подключения к Redis:", err);
  process.exit(1);
});


if (!DISCORD_BOT_TOKEN) {
  console.warn("⚠️ DISCORD_BOT_TOKEN не задан. /api/discord/messages вернёт 500.");
}


if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL не задан в переменных среды!");
  process.exit(1);
}

function parseLogTimestamp(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\u00A0/g, " ").trim(); // NBSP → space
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [_, Y, M, D, h, mi, se] = m;
  return new Date(Date.UTC(+Y, +M - 1, +D, +h, +mi, +se));
}

app.get("/api/health", async (req, res) => {
  try {
    await redis.ping();
    res.status(200).send("🟢 OK");
  } catch (e) {
    res.status(500).send("🔴 Redis недоступен");
  }
});

// примитивное кэширование ответов, чтобы не ловить rate limit
const discordCache = new Map(); // key: `${channelId}:${limit}` -> { ts, data }
const DISCORD_TTL = 60_000; // 30 сек

app.get("/api/discord/messages", async (req, res) => {
  try {
    const channelId = String(req.query.channelId || "");
    const limit = Math.min(Number(req.query.limit || 3), 50);

    if (!channelId) return res.status(400).json({ error: "channelId is required" });
    if (!DISCORD_BOT_TOKEN) return res.status(500).json({ error: "No bot token" });

    const key = `${channelId}:${limit}`;
    const hit = discordCache.get(key);
    const now = Date.now();
    if (hit && (now - hit.ts) < DISCORD_TTL) {
      return res.json(hit.data);
    }

    const url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(resp.status).json({ error: "Discord API error", details: text });
    }

    const messages = await resp.json(); // массив
    const simplified = messages.map(m => {
      // 1) Пытаемся взять обычный текст
      let text = (m.content || "").trim();
    
      // 2) Если пусто — собираем текст из всех embed'ов
      if (!text && Array.isArray(m.embeds) && m.embeds.length > 0) {
        const parts = [];
        for (const emb of m.embeds) {
          if (emb.title) parts.push(emb.title);
          if (emb.description) parts.push(emb.description);
          if (Array.isArray(emb.fields)) {
            for (const f of emb.fields) {
              const name = f.name ? `**${f.name}**` : "";
              const value = f.value || "";
              if (name || value) parts.push([name, value].filter(Boolean).join("\n"));
            }
          }
          if (emb.footer?.text) parts.push(emb.footer.text);
        }
        text = parts.join("\n\n").trim();
      }
    
      // 3) Если вообще ничего — пометим как системное/вложение
      if (!text && Array.isArray(m.attachments) && m.attachments.length > 0) {
        text = "[Attachment]";
      }
      if (!text && m.type !== 0) {
        text = "[System/Announcement]";
      }
    
      return {
        id: m.id,
        content: text,
        time: m.timestamp,
        author: m.author?.global_name || m.author?.username || "unknown",
        avatarUrl: m.author?.avatar
          ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png`
          : null,
        attachment: m.attachments?.[0]?.url || null,
        // type: m.type, flags: m.flags
      };
    });

    discordCache.set(key, { ts: now, data: simplified });
    res.json(simplified);
  } catch (e) {
    res.status(500).json({ error: "Discord fetch failed", details: e?.message });
  }
});

app.get('/api/donations', async (req, res) => {
  try {
    const resp = await fetch(DA_API_URL, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    const data = await resp.json();
    //console.log("DA API ответ:", data); 
    res.json(data.data.slice(0, 10)); // последние 10 донатов
  } catch (e) {
    res.status(500).json({ error: "DA API error", details: e.message });
  }
});

app.get("/api/patch", async (req, res) => {
  try {
    const version = await redis.get("latest_patch_version");
    const checked_at = await redis.get("latest_patch_checked_at");
    const changed_at = await redis.get("latest_patch_changed_at");

    const toISO = (raw) =>
      raw ? new Date(raw.replace(" ", "T") + "Z").toISOString() : null;

    res.json({
      version: version || null,
      checked_at: toISO(checked_at) || null,
      changed_at: toISO(changed_at) || null
    });
  } catch (e) {
    console.error("Ошибка получения версии патча:", e);
    res.status(500).json({ error: "Failed to get patch version" });
  }
});



app.get("/api/status", async (req, res) => {
  try {
    const lines = await redis.lRange("logs", -1000, -1);
    const parsed = lines
      .reverse()
      .map((line) => {
        const match = line.match(/^\[(.*?)\] (.*)$/);
        if (!match) return null;

        const rawTime = match[1]; // "2025-08-01 12:34:56"
        const statusText = match[2];

        // Преобразуем в ISO строку (UTC)
        const timestamp = new Date(rawTime.replace(" ", "T") + "Z");

        return {
          time: timestamp.toISOString(),
          status: statusText,
        };
      })
      .filter(Boolean);
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
    
      const timestamp = new Date(match[1].replace(" ", "T") + "Z");
      return {
        hour: timestamp.toISOString().slice(0, 13), // YYYY-MM-DDTHH (UTC)
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

app.get("/api/chart-events", async (req, res) => {
  try {
    const rawLogs = await redis.lRange("logs", -1000, -1);

    const parsed = rawLogs.map((line) => {
      const match = line.match(/^\[(.*?)\] Authserver status: (🟢|🔴) (UP|DOWN)/);
      if (!match) return null;
    
      // ВАЖНО! Явно указываем, что это UTC
      const timestamp = new Date(match[1].replace(" ", "T") + "Z");
      const statusValue = match[3] === "UP" ? 1 : 0;
    
      return {
        time: timestamp.toISOString(), // оставляем ISO формат
        statusValue,
      };
    }).filter(Boolean);

    res.json(parsed.reverse());
  } catch (e) {
    console.error("chart-events error:", e);
    res.status(500).json({ error: "Failed to get event chart" });
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

        const timestamp = new Date(match[1].replace(" ", "T") + "Z");
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
    const realms = ["Kezan", "Gurubashi", "Kezan-2", "Gurubashi-2"];
    const statuses = [];

    for (const realmKey of realms) {
      const logs = await redis.lRange(`logs:${realmKey}`, 0, 0);
      if (!logs.length) continue;

      const line = logs[0];

      // [ts] Realm Kezan status: 🔴 DOWN
      // [ts] Realm Kezan (1.2.3.4:8000) status: 🔴 DOWN
      const re = /^\[(.*?)\]\s+Realm\s+(.+?)(?:\s+\([^)]+\))?\s+status:\s+(🟢|🔴)\s+(UP|DOWN)/u;
      const m = line.match(re);
      if (!m) continue;

      const [, rawTime, rawName, icon, status] = m;
      const ts = parseLogTimestamp(rawTime);
      if (!ts || Number.isNaN(ts.getTime())) continue;

      const name = rawName.replace(/\s*\([^)]*\)/, "").trim();

      statuses.push({ name, time: ts.toISOString(), icon, status });
    }

    res.json(statuses);
  } catch (err) {
    console.error("Ошибка /api/realm-status:", err);
    res.status(500).json({ error: "Failed to get realm statuses", details: String(err?.message || err) });
  }
});


app.listen(PORT, () =>
  console.log(`🚀 Сервер API запущен на http://localhost:${PORT}`)
);
