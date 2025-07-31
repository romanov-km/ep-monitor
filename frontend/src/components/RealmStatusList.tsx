import React, { useEffect, useState } from "react";
import type { RealmStatus } from "../types/realm";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export const RealmStatusList: React.FC = () => {
  const [realms, setRealms] = useState<RealmStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealmData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/realm-status`);
        setRealms(res.data);
      } catch (err) {
        console.error("Ошибка загрузки данных для рилмов:", err);
      } finally {
        setLoading(false)
      }
    };
    fetchRealmData();
  }, []);

  if (loading)
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        Loading realm statuses...
      </div>
    );

  return (
    <div className="flex p-4 px-2 justify-center">
      <div className="flex space-x-4 overflow-x-auto">
        {realms.map((realm, idx) => {
          // Преобразуем строку "2025-07-31 13:30:47" → "2025-07-31T13:30:47Z"
          const utcDateStr = realm.time.replace(" ", "T") + "Z";
          const date = new Date(utcDateStr);
          const isValidDate = !isNaN(date.getTime());

          return (
            <div
              key={idx}
              className=" border border-gray-600 rounded-md p-3 bg-gray-900 text-gray-300"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{realm.icon}</span>
                <span
                  className={`text-xs font-semibold ${
                    realm.status === "DOWN" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {realm.status}
                </span>
              </div>

              <div className="font-semibold text-sm truncate mb-1">
                {realm.name}
              </div>
              {isValidDate && (
                <div className="flex justify-between text-xs text-gray-400 ">
                  Last check:
                  <time>
                    {date.toLocaleString("ru-RU", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
