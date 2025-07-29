// src/App.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface StatusEntry {
  time: string;
  status: string;
}

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get<StatusEntry[]>("/api/status");
      setStatuses(res.data);
    } catch (err) {
      console.error("Ошибка загрузки статуса:", err);
    }
  };

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = statuses
    .map((entry) => ({
      time: entry.time,
      statusValue: entry.status.includes("UP") ? 1 : 0
    }))
    .reverse();

    console.log(chartData);

  return (
    <div className="p-4 font-mono">
      <h1 className="text-2xl font-bold mb-4">📡 История статусов WoW-сервера</h1>

      <div className="mb-6 h-64">
        {chartData.length === 0 ? (
          <p className="text-gray-500">Нет данных для графика</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval='preserveStartEnd' />
              <YAxis domain={[0, 1]} tickFormatter={(v) => (v === 1 ? "UP" : "DOWN")} />
              <Tooltip formatter={(v) => (v === 1 ? "🟢 UP" : "🔴 DOWN")} />
              <Line type="monotone" dataKey="statusValue" stroke="#00cc66" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="space-y-1">
        {statuses.map((entry, i) => (
          <li key={i} className="text-sm">
            <span className="font-bold">[{entry.time}]</span> {entry.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;