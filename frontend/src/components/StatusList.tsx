import React from "react";

interface StatusEntry {
  time: string;
  status: string;
}

interface StatusListProps {
  statuses: StatusEntry[];
}

const StatusList: React.FC<StatusListProps> = ({ statuses }) => {
  return (
    <ul className="space-y-1 max-h-64 overflow-auto pr-2" id="status-list">
      {statuses
        .slice(0, 50)
        .map((entry, i) => (
          <li key={i} className="text-sm">
            <span className="font-bold">[{entry.time}]</span> {entry.status}
          </li>
        ))
        .reverse()}
    </ul>
  );
};

export default StatusList;