import { useEffect, useState, useRef } from "react";

interface UsersPanelProps {
  userCount: number;
  onlineUsers: string[];
  username: string;
}

const MAX_VISIBLE = 10;
const PING_DURATION = 2500; // ms

export const UsersPanel: React.FC<UsersPanelProps> = ({
  userCount,
  onlineUsers,
  username,
}) => {
  const [expanded, setExpanded] = useState(false);

  // NEW: Список новых юзеров, которые только что зашли
  const [newUsers, setNewUsers] = useState<string[]>([]);
  // Для сравнения прошлого списка
  const prevUsers = useRef<string[]>([]);

  // Следим за изменением onlineUsers
  useEffect(() => {
    const added = onlineUsers.filter(u => !prevUsers.current.includes(u));
    if (added.length) {
      setNewUsers(users =>
        Array.from(new Set([...users, ...added]))
      );
      // Удаляем новых через N секунд
      added.forEach(u => {
        setTimeout(() => {
          setNewUsers(users => users.filter(x => x !== u));
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
        {visible.filter(Boolean).map((u, i) => (
          <div
            key={i}
            title={u}
            className={
              u === username
                ? "text-emerald-400 font-semibold flex items-center drop-shadow"
                : "text-gray-200 hover:bg-white/10 hover:text-white rounded px-1 flex items-center transition-colors"
            }
          >
            {/* Показываем пинг только если этот юзер новый */}
            {newUsers.includes(u) && <OnlinePingDot />}
            {truncate(u, 20)}
            {u === username && (
              <span className="ml-1 text-xs text-emerald-300">• you</span>
            )}
          </div>
        ))}

        {hidden > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs px-2 py-0.5 bg-gray-700/70 hover:bg-blue-600 text-blue-200 hover:text-white rounded-full shadow transition"
          >
            {expanded ? "Collapse list" : `+${hidden} more`}
          </button>
        )}
      </div>
    </aside>
  );
};
