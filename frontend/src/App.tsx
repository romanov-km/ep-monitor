import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { translations } from "./locales";

interface StatusEntry {
  time: string;
  status: string;
}
const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const t = translations[language];

  const fetchStatuses = async () => {
    try {
      const res = await axios.get<StatusEntry[]>(`${API_BASE}/api/status`);
      setStatuses(res.data);
    } catch (err) {
      console.error("Ошибка загрузки статуса:", err);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "ru" || savedLang === "en") {
      setLanguage(savedLang);
    }
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    const list = document.getElementById("status-list");
    if (list) list.scrollTop = list.scrollHeight;
  }, [statuses]);

  const chartData = useMemo(() => {
    return statuses
      .map((entry) => {
        const rawDate = entry.time; // "2025-07-30"
        const rawTime = entry.status.slice(0, 8); // "01:41:44"

        const utcString = `${rawDate}T${rawTime}Z`; // UTC дата
        const localDate = new Date(utcString);

        const formatted = `${String(localDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(localDate.getDate()).padStart(2, "0")} ${localDate
          .getHours()
          .toString()
          .padStart(2, "0")}:${localDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        return {
          time: formatted,
          statusValue:
            entry.status.includes("🟢") || entry.status.includes("UP") ? 1 : 0,
        };
      })
      .reverse();
  }, [statuses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const status = payload[0].value === 1 ? "🟢 UP" : "🔴 DOWN";
      return (
        <div className="bg-white p-2 text-sm text-black rounded shadow">
          <p>⏰ {label}</p>
          <p>{status}</p>
        </div>
      );
    }
    return null;
  };
  const latestStatusEntry = statuses[0];
  const isServerUp = latestStatusEntry?.status.toUpperCase().includes("UP");
  console.log(latestStatusEntry);
  console.log(isServerUp);
  return (
    <div className="p-4 font-mono">
      <h1 className="text-1xl font-bold mb-4">{t.title}</h1>
      <div className="mb-4">
        <button
          onClick={() => setLanguage("ru")}
          className={`mr-2 px-2 py-1 border ${
            language === "ru" ? "bg-green-500 text-white" : "border-gray-600"
          }`}
        >
          🇷🇺 Русский
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`px-2 py-1 border ${
            language === "en" ? "bg-green-500 text-white" : "border-gray-600"
          }`}
        >
          🇬🇧 English
        </button>
      </div>

      <div className="mb-4 p-4 border border-gray-700 rounded bg-gray-900 text-sm leading-relaxed">
        📬 <strong>{t.telegramHeader}</strong>
        <br />
        {t.telegramBody.split("@epoch_monitoring_bot")[0]}
        <a
          href="https://t.me/epoch_monitoring_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 underline"
        >
          @epoch_monitoring_bot
        </a>
        {t.telegramBody.split("@epoch_monitoring_bot")[1]}
        <br />
        <br />
        {language === "ru" ? (
          <>
            🔔 Уведомления приходят{" "}
            <span className="text-green-300">мгновенно</span>. Подключение —{" "}
            <span className="underline">в 1 клик</span>.
          </>
        ) : (
          <>
            🔔 Notifications arrive{" "}
            <span className="text-green-300">instantly</span>. One-click
            connection.
          </>
        )}
      </div>

      <p className="text-sm">
        🔄 {t.lastStatus}:{" "}
        <span className={isServerUp ? "text-green-400" : "text-red-400"}>
          {isServerUp ? t.up : t.down}
        </span>
      </p>

      <div className="mb-6 h-64">
        {chartData.length === 0 ? (
          <p className="text-gray-500">Нет данных для графика</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(v) => (v === 1 ? "UP" : "DOWN")}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="statusValue"
                stroke="#00cc66"
                dot={false}
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="space-y-1 max-h-64 overflow-auto pr-2" id="status-list">
        {statuses
          .slice(0, 50)
          .map((entry, i) => (
            <li key={i} className="text-sm">
              <span className="font-bold">[{entry.time}]</span> {entry.status}
            </li>
          ))
          .reverse()}
      </ul>
    </div>
  );
}

export default App;
