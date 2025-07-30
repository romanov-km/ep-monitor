import React from "react";

interface StatusEntry {
  time: string;
  status: string;
}

interface StatusListProps {
  statuses: StatusEntry[];
}

const getLocalDateTime = (entry: StatusEntry) => {
  const rawTime = entry.status.slice(0, 8); // пример: "07:12:45"
  const utcString = `${entry.time}T${rawTime}Z`; // "2025-07-30T07:12:45Z"
  const localDate = new Date(utcString);

  return localDate.toLocaleString(undefined, {
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
    <ul className="space-y-1 max-h-40 overflow-auto pr-2" id="status-list">
      {statuses
        .slice(-200)
        .map((entry, i) => {
          const localTime = getLocalDateTime(entry);
          const cleanStatus = entry.status.replace(/^\d{2}:\d{2}:\d{2}\]?\s?/, "");
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
