import React, { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE;

const goal = 10000; // Цель месяца

export interface Donation {
  id: number;
  name: string;
  username: string;
  message: string;
  amount: number;
  currency: string;
  is_shown: number;
  created_at: string;
  shown_at: string | null;
  amount_in_user_currency: number;
}

const currencySymbols: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  GBP: "£",
  UAH: "₴",
};

export const DonatCard: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/donations`)
      .then((res) => res.json())
      .then((data: Donation[]) => {
        // Если твоя ручка отдаёт именно data.data:
        // .then((resp) => resp.json()).then(data => data.data)
        setDonations(data);
        // Фильтруем только публичные донаты
        const visible = data.filter((d) => d.is_shown === 1);
        const total = visible.reduce((sum, d) => sum + Number(d.amount), 0);
        setCurrent(total);
      });
  }, []);

  const percent = Math.min(100, Math.round((current / goal) * 100));

  return (
    <div className="w-1/5 max-w-xs flex flex-col gap-1 backdrop-blur-lg shadow-2xl rounded-2xl px-2 py-2 transition-all duration-200 hover:shadow-emerald-400/30 hover:shadow-2xl hover:border-emerald-300 bg-black/55">
      {/* <h3 className="text-xl font-bold text-green-400 mb-1">Поддержи сервер</h3> */}
      {/* <div className="text-gray-300 text-sm mb-2">
        1
      </div> */}
      <a
        href="https://www.donationalerts.com/r/yakuji_" // твоя ссылка
        target="_blank"
        rel="noopener noreferrer"
        className="bg-emerald-700 hover:bg-emerald-600 text-black font-semibold py-2 px-4 rounded-xl text-center transition"
      >
        Donate
      </a>
      <div className="">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          {/* <span>target:{goal}%</span> */}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-400 h-3 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
      <div className="">
        <div className="text-xs text-gray-400 mb-1">top donators:</div>
        <ul className="space-y-1">
          {donations.length === 0 && (
            <li className="text-gray-500 text-xs">no donats 😔</li>
          )}
          {donations
            .filter((d) => d.is_shown === 1)
            .slice(0, 5)
            .map((d) => (
              <li key={d.id} className="flex justify-between text-sm">
                <span className="text-green-300 font-semibold">
                  {d.username || d.name}
                </span>
                <span className="text-gray-200">
                  {d.amount} {currencySymbols[d.currency] || d.currency}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default DonatCard;
