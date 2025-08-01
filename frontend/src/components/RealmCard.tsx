import React from "react";
import { observer } from "mobx-react-lite";

interface RealmCardProps {
  name: string;
  icon: string;
  status: string;
  time: string;
}

export const RealmCard: React.FC<RealmCardProps> = observer(
  ({ name, icon, status, time }) => {
    const date = new Date(time);
    const isValidDate = !isNaN(date.getTime());

    return (
      <div className="border border-gray-600 rounded-md p-3 bg-gray-900 text-gray-300">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xl">{icon}</span>
          <span
            className={`text-xs font-semibold ${
              status === "DOWN" ? "text-red-500" : "text-green-500"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="font-semibold text-sm truncate mb-1">{name}</div>
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
