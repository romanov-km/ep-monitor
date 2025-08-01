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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { time, statusValue } = payload[0].payload;
    const status = statusValue === 1 ? "🟢 UP" : "🔴 DOWN";

    const date = new Date(time); // ISO формат → корректный парсинг
    const localTime = date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      timeZoneName: "short",
      hour12: false,
    });

    return (
      <div className="bg-white p-2 text-sm text-black rounded shadow">
        <p>⏰ {localTime}</p>
        <p>{status}</p>
      </div>
    );
  }
  return null;
};


const StatusChart: React.FC<StatusChartProps> = ({ chartData }) => {
  return (
    <div className="mb-6 h-24">
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
              tickFormatter={(str) => {
                const [date, time] = str.split(" ");
                return `${time}\n${date}`;
              }}
            />
            <YAxis
              label={{
                value: "Status",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
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
