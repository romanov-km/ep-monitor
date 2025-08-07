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
    }, 1800);
  };

  const liftServer = () =>
    runWithDelay("lift", 0.2, triggerUp, jokes, "🎉 The server magically started!");

  const crashServer = () =>
    runWithDelay("crash", 0.25, triggerDown, crashJokes, "💥 The server exploded!");

  const triggerUp = () => {
    realmStore.setRealms([
      {
        name: "Kezan",
        status: "UP",
        icon: "🟢",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
      {
        name: "Gurubashi",
        status: "UP",
        icon: "🟢",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    ]);
  };

  const triggerDown = () => {
    realmStore.setRealms([
      {
        name: "Kezan PVE",
        status: "DOWN",
        icon: "🔴",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
      {
        name: "Gurubashi",
        status: "DOWN",
        icon: "🔴",
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    ]);
  };

  return (
    <div className="
      mt-5 mb-4
      bg-black/60 backdrop-blur-md rounded-2xl border border-emerald-800/40 shadow-xl
      px-5 py-4
      text-white text-sm
      max-w-md mx-auto
      animate-fadeIn
    ">
      <p className="mb-3 text-emerald-300 font-bold flex items-center gap-1">
        🧪 <span>Server Debug Panel</span>
      </p>

      <p className="mb-3 text-gray-300">
        Tick the checkbox at the top of the page and try “Lift” or “Crash”! Useful for testing UI/alerts.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={liftServer}
          disabled={loading !== null}
          className={`
            px-4 py-2 rounded-xl font-semibold shadow
            transition-all
            flex items-center gap-1
            ${loading === "lift"
              ? "bg-emerald-700/80 cursor-wait"
              : "bg-emerald-700 hover:bg-emerald-600 active:bg-green-800"}
            text-white
            disabled:opacity-50 disabled:pointer-events-none
          `}
        >
          {loading === "lift"
            ? (<><span className="animate-spin mr-1">🔄</span> Lifting…</>)
            : (<>🔧 Lift the server</>)
          }
        </button>
        <button
          onClick={crashServer}
          disabled={loading !== null}
          className={`
            px-4 py-2 rounded-xl font-semibold shadow
            transition-all
            flex items-center gap-1
            ${loading === "crash"
              ? "bg-pink-700/80 cursor-wait"
              : "bg-pink-700 hover:bg-pink-600 active:bg-red-900"}
            text-white
            disabled:opacity-50 disabled:pointer-events-none
          `}
        >
          {loading === "crash"
            ? (<><span className="animate-spin mr-1">💣</span> Crashing…</>)
            : (<>💣 Crash the server</>)
          }
        </button>
      </div>

      {msg && (
        <p className="
          mt-4 italic font-medium
          text-yellow-300
          transition-opacity duration-300
          text-center
          min-h-[32px]
        ">
          {msg}
        </p>
      )}
    </div>
  );
};
