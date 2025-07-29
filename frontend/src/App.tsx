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

interface StatusEntry {
  time: string;
  status: string;
}
const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get<StatusEntry[]>(`${API_BASE}/api/status`);
      setStatuses(res.data);
    } catch (err) {
      console.error("Ошибка загрузки статуса:", err);
    }
  };

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const list = document.getElementById("status-list");
    if (list) list.scrollTop = list.scrollHeight;
  }, [statuses]);

  const chartData = useMemo(() => {
    return statuses
      .map((entry) => ({
        time: `${entry.time} ${entry.status.slice(0, 8)}`,
        statusValue:
          entry.status.includes("🟢") || entry.status.includes("UP") ? 1 : 0,
      }))
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

  return (
    <div className="p-4 font-mono">
      <h1 className="text-2xl font-bold mb-4">
        📡 История статусов WoW-сервера Эбобаный Эчпочмак
      </h1>

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
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="space-y-1 max-h-64 overflow-auto pr-2" id="status-list">
        {statuses.slice(0, 50).map((entry, i) => (
          <li key={i} className="text-sm">
            <span className="font-bold">[{entry.time}]</span> {entry.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
