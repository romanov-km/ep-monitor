import { useEffect, useState, useRef, useMemo } from "react";

interface UsersPanelProps {
  userCount: number;
  onlineUsers: string[];
  username: string;
  userActivity: Record<string, number>;
}

const MAX_VISIBLE = 13;
const PING_DURATION = 2500; // ms
const TOP_N = 3;  

export const UsersPanel: React.FC<UsersPanelProps> = ({
  userCount,
  onlineUsers,
  username,
  userActivity,
}) => {
  const [expanded, setExpanded] = useState(false);

   // Вычисляем топ-активных
  const topUsers = useMemo(() => {
    return [...onlineUsers]
      .sort((a, b) => (userActivity[b] || 0) - (userActivity[a] || 0))
      .slice(0, TOP_N);
  }, [onlineUsers, userActivity]);

  // Остальные — без топа
  const otherUsers = onlineUsers.filter((u) => !topUsers.includes(u));

    // Какие реально отображаем (с учётом expanded)
  const visible = expanded
    ? [...topUsers, ...otherUsers]
    : [...topUsers, ...otherUsers.slice(0, MAX_VISIBLE - TOP_N)];
  const hidden = otherUsers.length - (MAX_VISIBLE - TOP_N);

  // NEW: Список новых юзеров, которые только что зашли
  const [newUsers, setNewUsers] = useState<string[]>([]);
  // Для сравнения прошлого списка
  const prevUsers = useRef<string[]>([]);

  // Следим за изменением onlineUsers
  useEffect(() => {
    const added = onlineUsers.filter((u) => !prevUsers.current.includes(u));
    if (added.length) {
      setNewUsers((users) => Array.from(new Set([...users, ...added])));
      // Удаляем новых через N секунд
      added.forEach((u) => {
        setTimeout(() => {
          setNewUsers((users) => users.filter((x) => x !== u));
        }, PING_DURATION);
      });
    }
    prevUsers.current = onlineUsers;
  }, [onlineUsers]);

  const truncate = (str: string | null | undefined, n = 16) =>
    !str ? "" : str.length > n ? str.slice(0, n) + "…" : str;

  function OnlinePingDot() {
    return (
      <span className="relative flex h-3 w-3 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
      </span>
    );
  }

  return (
    <aside className="sm:w-48 md:w-56 lg:w-44 shrink-0 bg-black/50 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg p-3">
      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1">
        <span>👥</span>
        In chat:{" "}
        <span className="text-emerald-400 font-mono ml-1">{userCount}</span>
      </h3>
      {/* <div className="text-xs max-h-60 overflow-y-auto space-y-1 pr-1"> */}
      <div className="text-xs max-h-60 overflow-y-auto pr-1">
        {/* Новые юзеры */}
        {newUsers
          .filter((u) => visible.includes(u))
          .map((u) => (
            <div
              key={"new-" + u}
              className="flex items-center font-semibold text-emerald-400 truncate w-full"
            >
              <OnlinePingDot />
              <span className="truncate max-w-[120px]">{truncate(u, 12)}</span>
              {u === username && (
                <span className="ml-1 text-xs text-emerald-300">•</span>
              )}
            </div>
          ))}

        {/* ТОП активные (без дубликатов и без новых) */}
        {/* top users — с🔥 и количеством */}
        {topUsers.map((u, i) => (
          <div
            key={`top-${u}-${i}`}
            className={`font-bold text-orange-400 flex items-center`}
            title={u}
          >
            <span className="mr-1">🔥</span>
            {truncate(u, 12)}
            <span className="ml-1">({userActivity[u] || 0})</span>
            {u === username && <span className="ml-1 text-emerald-300">•</span>}
          </div>
        ))}

        {/* остальные */}
        {otherUsers.slice(0, expanded ? undefined : MAX_VISIBLE - TOP_N).map((u, i) => (
          <div key={`rest-${u}-${i}`} className="text-gray-200 flex items-center" title={u}>
            {truncate(u, 12)}
            {u === username && <span className="ml-1 text-emerald-300">•</span>}
          </div>
        ))}

        {/* Кнопка разворота */}
        {hidden > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs px-2 py-0.5 bg-gray-700/70 hover:bg-blue-600 text-blue-200 hover:text-white rounded-full shadow transition w-full"
          >
            {expanded ? "Collapse list" : `+${hidden} more`}
          </button>
        )}
      </div>
    </aside>
  );
};
