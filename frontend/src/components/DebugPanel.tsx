import React, { useState } from "react";
import { realmStore } from "../stores/realmStore";

const jokes = [
  "😴 Server is still sleeping…",
  "🍕 Server grabbed a slice of pizza.",
  "🤖 AI is fixing it… someday.",
  "💸 Insert coin to continue.",
  "🚜 Server is plowing slowly.",
  "🙃 Nope. Try turning it off and on again.",
];

const crashJokes = [
  "🛡️ Server resisted your attack!",
  "🐛 Nice try, but bugs are on vacation.",
  "🔥 Firewall says nope.",
  "✨ You need more wands of crashing.",
  "👾 Error 502: Mood not found.",
];

export const DebugPanel: React.FC = () => {
  const [loading, setLoading] = useState<"lift" | "crash" | null>(null);
  const [msg, setMsg] = useState("");

  const runWithDelay = (
    type: "lift" | "crash",
    successChance: number,
    successFn: () => void,
    jokes: string[],
    successMsg: string
  ) => {
    setLoading(type);
    setMsg("");
    setTimeout(() => {
      setLoading(null);
      if (Math.random() < successChance) {
        successFn();
        setMsg(successMsg);
      } else {
        setMsg(jokes[Math.floor(Math.random() * jokes.length)]);
      }
    }, 2000);
  };

  const liftServer = () =>
    runWithDelay(
      "lift",
      0.2,
      triggerUp,
      jokes,
      "🎉 The server magically started!"
    );

    const crashServer = () =>
      runWithDelay(
        "crash",
        0.25,
        triggerDown,
        crashJokes,
        "💥 The server exploded!"
      );

  const triggerUp = () => {
        realmStore.setRealms([
          {
            name: "Kezan PVE (Debian Linux)",
            status: "UP",
            icon: "🟢",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          {
            name: "Gurubashi PVP (Debian Linux)",
            status: "UP",
            icon: "🟢",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          {
            name: "Kezan PVE (Windows old)",
            status: "UP",
            icon: "🟢",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          {
            name: "Gurubashi PVP (Windows old)",
            status: "UP",
            icon: "🟢",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
        ]);
      };
    
      const triggerDown = () => {
        realmStore.setRealms([
          {
            name: "Kezan PVE (Debian Linux)",
            status: "DOWN",
            icon: "🔴",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          {
            name: "Gurubashi PVP (Debian Linux)",
            status: "DOWN",
            icon: "🔴",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          {
            name: "Kezan PVE (Windows old)",
            status: "DOWN",
            icon: "🔴",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          {
            name: "Gurubashi PVP (Windows old)",
            status: "DOWN",
            icon: "🔴",
            time: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
        ]);
      };

  return (
    <div className="mt-4 border p-3 rounded bg-gray-800 text-white text-sm">
    <p className="mb-2">
      🧪 <strong>Server Panel</strong> — Tick the checkbox at the top of the page and try!
    </p>

    <div className="flex flex-wrap gap-4">
      <button
        onClick={liftServer}
        disabled={loading !== null}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center"
      >
        {loading === "lift" ? (
          <>
            <span className="animate-spin mr-2">🔄</span> Lifting…
          </>
        ) : (
          "🔧 Lift the server"
        )}
      </button>

      <button
        onClick={crashServer}
        disabled={loading !== null}
        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center"
      >
        {loading === "crash" ? (
          <>
            <span className="animate-spin mr-2">💣</span> Crashing…
          </>
        ) : (
          "💣 Crash the server"
        )}
      </button>
    </div>

    {msg && (
      <p className="mt-2 italic text-yellow-400 transition-opacity duration-300">
        {msg}
      </p>
    )}
  </div>
  );
};