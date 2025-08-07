import React from "react";
import { observer } from "mobx-react-lite";

interface RealmCardProps {
  name: string;
  icon: string;
  status: "UP" | "DOWN" | string;
  time: string;
}

export const RealmCard: React.FC<RealmCardProps> = observer(
  ({ name, icon, status, time }) => {
    const date = new Date(time);
    const isValidDate = !isNaN(date.getTime());
    const isDown = status === "DOWN";

    // Цвета и glow для hover
    const cardColor = [
      "border",
      "backdrop-blur-lg",
      "shadow-2xl",
      "rounded-2xl",
      "px-5",
      "py-4",
      "transition-all",
      "duration-200",
      "hover:shadow-emerald-400/30",
      "hover:shadow-2xl",
      "hover:border-emerald-300",
      "bg-black/55",
      isDown
        ? "border-red-500/70 hover:border-red-400"
        : "border-green-500/60"
    ].join(" ");

    const statusColor = isDown
      ? "text-red-400 drop-shadow-md"
      : "text-emerald-400 drop-shadow-md";

    return (
      <div className={cardColor}>
        {/* Верхняя строка: иконка + статус */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl drop-shadow">{icon}</span>
          <span
            className={`text-xs font-extrabold uppercase tracking-widest ${statusColor} `}
          >
            {status}
          </span>
        </div>
        {/* Название реалма */}
        <div className="font-extrabold text-lg truncate mb-1 text-gray-100 drop-shadow-lg tracking-wide">
          {name}
        </div>
        {/* Время последней проверки */}
        {isValidDate && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="text-gray-500">⏱️</span>
            <span className="font-mono">
              {date.toLocaleString(undefined, {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        )}
      </div>
    );
  }
);

export default RealmCard;
