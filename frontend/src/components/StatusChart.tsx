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

interface StatusChartProps {
  chartData: ChartPoint[];
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

const StatusChart: React.FC<StatusChartProps> = ({ chartData }) => {
  return (
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
  );
};

export default StatusChart;
