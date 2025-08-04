import React from "react";
import { observer } from "mobx-react-lite";

interface RealmCardProps {
  name: string;
  icon: string;
  status: "UP" | "DOWN" | string;
  time: string;
}

/**
 * Карточка состояния реалма.
 *
 * Цвет фона и рамки меняется в зависимости от статуса:
 *  - UP   → зелёная (bg-green-800 / border-green-600)
 *  - DOWN → красная (bg-red-800  / border-red-600)
 *
 * При наведении цвет слегка подсветится.
 */
export const RealmCard: React.FC<RealmCardProps> = observer(
  ({ name, icon, status, time }) => {
    const date = new Date(time);
    const isValidDate = !isNaN(date.getTime());

    const isDown = status === "DOWN";
    const cardColor = isDown
      ? "bg-red-800 border-red-600 hover:bg-red-700"
      : "bg-green-800 border-green-600 hover:bg-green-700";
    const statusColor = isDown ? "text-red-400" : "text-green-400";

    return (
      <div
        className={`rounded-md p-3 m-1 border ${cardColor} text-gray-100 transition-colors shadow-sm`}
      >
        {/* Верхняя строка: иконка + статус */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl leading-none">{icon}</span>
          <span className={`text-xs font-semibold ${statusColor}`}>{status}</span>
        </div>

        {/* Название реалма */}
        <div className="font-semibold text-sm truncate mb-1">{name}</div>

        {/* Время последней проверки */}
        {isValidDate && (
          <div className="flex justify-between text-xs text-gray-300">
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
