import { useEffect, useState, useRef } from "react";

interface UsersPanelProps {
  userCount: number;
  onlineUsers: string[];
  username: string;
  userActivity: Record<string, number>;
}

const MAX_VISIBLE = 10;
const PING_DURATION = 2500; // ms

export const UsersPanel: React.FC<UsersPanelProps> = ({
  userCount,
  onlineUsers,
  username,
  userActivity,
}) => {
  const [expanded, setExpanded] = useState(false);

  // NEW: Список новых юзеров, которые только что зашли
  const [newUsers, setNewUsers] = useState<string[]>([]);
  // Для сравнения прошлого списка
  const prevUsers = useRef<string[]>([]);

  const TOP_ACTIVE = 3;
  const mostActive = [...onlineUsers]
    .filter((u) => !newUsers.includes(u))
    .sort((a, b) => (userActivity[b] || 0) - (userActivity[a] || 0))
    .slice(0, TOP_ACTIVE);

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

  const visible = expanded ? onlineUsers : onlineUsers.slice(0, MAX_VISIBLE);
  const hidden = onlineUsers.length - visible.length;

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
      <div className="text-xs max-h-60 overflow-y-auto space-y-1 pr-1">
        {/* Новые юзеры */}
        {newUsers
          .filter((u) => visible.includes(u))
          .map((u) => (
            <div
              key={"new-" + u}
              className="flex items-center font-semibold text-emerald-400 truncate w-full"
            >
              <OnlinePingDot />
              <span className="truncate max-w-[120px]">{truncate(u, 20)}</span>
              {u === username && (
                <span className="ml-1 text-xs text-emerald-300">• you</span>
              )}
            </div>
          ))}

        {/* ТОП активные (без дубликатов и без новых) */}
        {mostActive
          .filter((u) => !newUsers.includes(u))
          .map((u) => (
            <div
              key={"active-" + u}
              className="flex items-center font-semibold text-orange-300 truncate w-full"
            >
              <span className="mr-1">🔥</span>
              <span className="truncate max-w-[120px]">{truncate(u, 20)}</span>
              <span className="ml-1 text-[10px] text-orange-400">
                ({userActivity[u] || 0})
              </span>
              {u === username && (
                <span className="ml-1 text-xs text-emerald-300">• you</span>
              )}
            </div>
          ))}

        {/* Остальные */}
        {visible
          .filter((u) => !newUsers.includes(u) && !mostActive.includes(u))
          .map((u) => (
            <div
              key={u}
              className={
                "truncate w-full flex items-center " +
                (u === username
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-200 hover:bg-white/10 hover:text-white rounded px-1 transition-colors")
              }
            >
              <span className="truncate max-w-[120px]">{truncate(u, 20)}</span>
              {u === username && (
                <span className="ml-1 text-xs text-emerald-300">• you</span>
              )}
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
