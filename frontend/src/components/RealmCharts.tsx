import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  time: string;
  statusValue: number;
}

interface RealmChartProps {
  realmData: Record<string, ChartPoint[]>;
}

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

const RealmCharts: React.FC<RealmChartProps> = ({ realmData }) => {
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap md:justify-between space-y-6 md:space-y-0 md:space-x-4 p-4">
      {Object.entries(realmData).map(([realmName, data]) => (
        <div
          key={realmName}
          className="w-full md:w-[48%] border border-gray-700 rounded p-2 bg-gray-900"
        >
          <h2 className="text-sm font-bold mb-1 text-center text-gray-300">
            🧭 {realmName}
          </h2>
          {data.length === 0 ? (
            <p className="text-gray-500 text-center">Нет данных</p>
          ) : (
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    tickFormatter={(str) => {
                      const [date, time] = str.split(" ");
                      return `${time}\n${date}`;
                    }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(v) => (v === 1 ? "UP" : "DOWN")}
                    width={40}
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


export default RealmCharts;
