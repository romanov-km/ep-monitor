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

    // Стилизация карточки
    const cardColor = [
      "border",
      "backdrop-blur-md",
      "shadow-xl",
      "rounded-2xl",
      "px-4",
      "py-3",
      "transition-colors",
      "duration-200",
      "hover:bg-black/70",
      "bg-black/60",
      isDown
        ? "border-red-500/70"
        : "border-green-500/60"
    ].join(" ");

    const statusColor = isDown ? "text-red-400" : "text-green-400";

    return (
      <div className={cardColor}>
        {/* Верхняя строка: иконка + статус */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl leading-none">{icon}</span>
          <span className={`text-xs font-bold tracking-wide ${statusColor}`}>{status}</span>
        </div>
        {/* Название реалма */}
        <div className="font-semibold text-base truncate mb-1 text-gray-100 drop-shadow">
          {name}
        </div>
        {/* Время последней проверки */}
        {isValidDate && (
          <div className="flex justify-between text-xs text-gray-400">
            Last check:
            <time>
              {date.toLocaleString(undefined, {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </time>
          </div>
        )}
      </div>
    );
  }
);


export default RealmCard;
