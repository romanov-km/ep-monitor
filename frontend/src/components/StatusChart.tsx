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

interface StatusChartProps {
  chartData: ChartPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { time, statusValue } = payload[0].payload;
    const status =
      statusValue === 1
        ? <span className="text-emerald-400 font-bold">🟢 UP</span>
        : <span className="text-red-400 font-bold">🔴 DOWN</span>;

    const date = new Date(time);
    const localTime = date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      timeZoneName: "short",
      hour12: false,
    });

    return (
      <div className="bg-gray-900/95 border border-cyan-700/30 rounded-lg shadow-xl px-3 py-2 text-xs text-emerald-100">
        <div className="mb-1">⏰ <span className="font-mono">{localTime}</span></div>
        <div>{status}</div>
      </div>
    );
  }
  return null;
};

const StatusChart: React.FC<StatusChartProps> = ({ chartData }) => {
  return (
    <div className="
      p-4
      bg-black/60 backdrop-blur-md
      border border-cyan-700/30
      rounded-2xl shadow-lg
      max-w-2xl mx-auto
      max-h-60 h-60 sm:h-60
      flex items-center
    ">
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-center w-full">Нет данных для графика</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#ccc" }}
              interval="preserveStartEnd"
              minTickGap={50}
              tickFormatter={(isoString) => {
                const date = new Date(isoString);
                return (
                  date.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }) +
                  "\n" +
                  date.toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                  })
                );
              }}
              axisLine={{ stroke: "#256d5a" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 1]}
              tick={{ fontSize: 13, fill: "#ccc", fontWeight: 700 }}
              tickFormatter={(v) => (v === 1 ? "UP" : v === 0 ? "DOWN" : v.toString())}
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
      )}
    </div>
  );
};

export default StatusChart;
