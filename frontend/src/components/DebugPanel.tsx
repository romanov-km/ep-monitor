import React from "react";
import { realmStore } from "../stores/realmStore";

export const DebugPanel: React.FC = () => {
  const triggerUp = () => {
    realmStore.setRealms([
      {
        name: "Kezan PVP",
        status: "UP",
        icon: "🟢",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
      {
        name: "Gurubashi PVP",
        status: "UP",
        icon: "🟢",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      }
    ]);
  };

  const triggerDown = () => {
    realmStore.setRealms([
      {
        name: "Kezan PVP",
        status: "DOWN",
        icon: "🔴",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
      {
        name: "Gurubashi PVP",
        status: "DOWN",
        icon: "🔴",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    ]);
  };

  return (
    <div className="mt-4 border p-3 rounded bg-gray-800 text-white text-sm">
      <p className="mb-2">🧪 <strong>Debug Panel</strong> — тест звука при смене статуса</p>
      <div className="flex space-x-4">
        <button
          onClick={triggerDown}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          Симулировать 🔴 DOWN
        </button>
        <button
          onClick={triggerUp}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
        >
          Симулировать 🟢 UP
        </button>
      </div>
    </div>
  );
};
