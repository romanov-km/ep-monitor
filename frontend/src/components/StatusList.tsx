import React from "react";

interface StatusEntry {
  time: string;
  status: string;
}

interface StatusListProps {
  statuses: StatusEntry[];
}

const getLocalDateTime = (entry: StatusEntry) => {
  const date = new Date(entry.time);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// Краш/Ап статус подсвечивать разным цветом
const parseStatusColor = (msg: string) => {
  if (/🟢|UP|ONLINE/i.test(msg)) return "text-emerald-400";
  if (/🔴|DOWN|OFFLINE|CRASH|FAIL/i.test(msg)) return "text-red-400";
  if (/⚠️|WARN|WARNING/i.test(msg)) return "text-yellow-300";
  return "text-gray-200";
};

const StatusList: React.FC<StatusListProps> = ({ statuses }) => {
  return (
    <div className="
      p-3
      bg-black/50 backdrop-blur-md border border-cyan-700/30 rounded-xl shadow-md
      max-h-60 overflow-y-auto pr-1
      text-sm font-mono
      animate-fadeIn
    " id="status-list">
      <ul className="space-y-1">
        {statuses.slice(-1000).map((entry, i) => {
          const localTime = getLocalDateTime(entry);
          const cleanStatus = entry.status.replace(
            /^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]\s?/,
            ""
          );
          const color = parseStatusColor(cleanStatus);
          return (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gray-500 min-w-[124px]">{`[${localTime}]`}</span>
              <span className={`${color} break-words`}>{cleanStatus}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default StatusList;
