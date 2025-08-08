import React, { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE;

const goal = 7000; // Цель месяца

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

export const DonateCard: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [current, setCurrent] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/donations`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const data: Donation[] = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
        const sorted = [...data].sort((a, b) => {
          const av = Number(a.amount_in_user_currency ?? a.amount ?? 0);
          const bv = Number(b.amount_in_user_currency ?? b.amount ?? 0);
          return bv - av;
        });
        const total = sorted.reduce(
          (sum, d) =>
            sum + Number(d.amount_in_user_currency ?? d.amount ?? 0),
          0
        );
        if (!isMounted) return;
        setDonations(sorted);
        setCurrent(total);
      } catch (e: any) {
        if (!isMounted) return;
        setDonations([]);
        setCurrent(0);
        setError(e?.message || "failed");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const percent = Math.min(100, Math.round((current / goal) * 100));
  return (
   <div className="w-full sm:w-64 max-w-full sm:max-w-xs shrink-0 flex flex-col gap-1 backdrop-blur-lg shadow-2xl rounded-2xl px-2 py-2 transition-all duration-200 hover:shadow-emerald-400/30 hover:shadow-2xl hover:border-emerald-300 bg-black/55">
      <a
        href="https://www.donationalerts.com/r/yakuji_"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-emerald-700 hover:bg-emerald-600 text-black font-semibold py-2 px-4 rounded-xl text-center transition"
      >
        Donate
      </a>
      <p className="text-xs text-gray-300 mt-1 mb-2 text-center">
  💸 All donations go towards paying for the site and supporting the project!
</p>
      <div className="">
        
        <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>now:{percent}$</span>
          <span>target:{goal/100}$</span>
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
          {loading && <li className="text-gray-500 text-xs">loading…</li>}
          {!loading && error && (
            <li className="text-red-400 text-xs">failed to load donations</li>
          )}
          {!loading && !error && donations.length === 0 && (
            <li className="text-gray-500 text-xs">no donats 😔</li>
          )}
          {!loading && !error &&
            (showAll ? donations : donations.slice(0, 5)).map((d) => (
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
        {!loading && !error && donations.length > 5 && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="mt-1 w-full text-center text-xs text-blue-300 hover:text-blue-400 transition rounded-full bg-black/30 px-3 py-1"
          >
            {showAll ? "Show less" : `+${donations.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
};

export default DonateCard;
