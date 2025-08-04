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

const StatusList: React.FC<StatusListProps> = ({ statuses }) => {
  return (
    <ul className="p-4 space-y-1 max-h-30 overflow-auto pr-2" id="status-list">
      {statuses
        .slice(-1000)
        .map((entry, i) => {
          const localTime = getLocalDateTime(entry);
          const cleanStatus = entry.status.replace(
            /^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]\s?/,
            ""
          );
          return (
            <li key={i} className="text-sm">
              <span className="font-bold">[{localTime}]</span> {cleanStatus}
            </li>
          );
        })}
    </ul>
  );
};


export default StatusList;
