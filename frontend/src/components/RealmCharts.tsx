import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ChartPoint {
  time: string;
  statusValue: number;
}

interface RealmChartProps {
  realmData: Record<string, ChartPoint[]>;
}

// Custom Tooltip with WoW vibe
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const status = payload[0].value === 1 ? (
      <span className="font-bold text-emerald-500">🟢 UP</span>
    ) : (
      <span className="font-bold text-red-400">🔴 DOWN</span>
    );
    return (
      <div className="bg-gray-900/95 border border-cyan-700/30 rounded-lg shadow-xl px-3 py-2 text-xs text-emerald-100">
        <div className="mb-1">⏰ <span className="font-mono">{label}</span></div>
        <div>{status}</div>
      </div>
    );
  }
  return null;
};

const RealmCharts: React.FC<RealmChartProps> = ({ realmData }) => {
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap md:justify-between gap-6 p-4">
      {Object.entries(realmData).map(([realmName, data]) => (
        <div
          key={realmName}
          className="
            w-full md:w-[48%]
            bg-black/70 backdrop-blur-md rounded-2xl shadow-lg border border-cyan-700/30
            px-4 py-3
            flex flex-col items-stretch
          "
        >
          <h2 className="text-base font-bold mb-2 text-center text-cyan-300 drop-shadow">
            🧭 {realmName}
          </h2>
          {data.length === 0 ? (
            <p className="text-gray-400 text-center">Нет данных</p>
          ) : (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#ccc" }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                    tickFormatter={(str) => {
                      const [date, time] = str.split(" ");
                      return `${time}\n${date}`;
                    }}
                    axisLine={{ stroke: "#256d5a" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tick={{ fontSize: 12, fill: "#ccc", fontWeight: 700 }}
                    tickFormatter={(v) =>
                      v === 1
                        ? "UP"
                        : v === 0
                        ? "DOWN"
                        : v.toString()
                    }
                    width={40}
                    axisLine={{ stroke: "#256d5a" }}
                    tickLine={false}
                  />
                  <ReferenceLine y={1} stroke="#14ff92" strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke="#fb7185" strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="statusValue"
                    stroke="#14ff92"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={600}
                    className="drop-shadow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RealmCharts;
