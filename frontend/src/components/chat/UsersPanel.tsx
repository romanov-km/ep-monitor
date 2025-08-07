import { useState } from "react";

interface UsersPanelProps {
  userCount: number;
  onlineUsers: string[];
  username: string;
}

const MAX_VISIBLE = 10;

export const UsersPanel: React.FC<UsersPanelProps> = ({
  userCount,
  onlineUsers,
  username,
}) => {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? onlineUsers : onlineUsers.slice(0, MAX_VISIBLE);

  const hidden = onlineUsers.length - visible.length;

  const truncate = (str: string | null | undefined, n = 15) => {
    if (!str) return "";
    return str.length > n ? str.slice(0, n) + "…" : str;
  };

  return (
    <aside className="sm:w-48 md:w-56 lg:w-44 shrink-0">
      <h3 className="text-sm font-semibold text-white mb-1">
        👥 In chat: {userCount}
      </h3>
      
      <div className="text-xs text-gray-400 max-h-60 overflow-y-auto space-y-1 pr-1">
        {visible.filter(Boolean).map((u, i) => (
          <div
            key={i}
            className={
                u === username
                  ? "text-green-800 font-semibold"
                  : ""
              }
            title={u}
          >
           {truncate(u, 20)} 
          </div>
        ))}

        {hidden > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="underline text-blue-400"
          >
            {expanded ? "Collapse list" : `+ ${hidden} more`}
          </button>
        )}
      </div>
    </aside>
  );
};
