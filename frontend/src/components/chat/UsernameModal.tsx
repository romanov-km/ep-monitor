import React, { useEffect, useState } from "react";

interface UsernameModalProps {
  error?: string;
  wait?: number;
  onSubmit: (name: string) => void;
  currentUsername?: string;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ error, wait, onSubmit, currentUsername }) => {
  const [name, setName] = useState("");
  const [seconds, setSeconds] = useState(wait ? Math.ceil(wait / 1000) : 0);
  const [suggested, setSuggested] = useState(() =>
    currentUsername ? currentUsername + Math.floor(Math.random() * 1000) : "user" + Math.floor(Math.random() * 1000)
  );

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!seconds) return;
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  // Обновить при wait из пропсов
  useEffect(() => {
    setSeconds(wait ? Math.ceil(wait / 1000) : 0);
  }, [wait]);

  const handleSuggest = () => {
    const newNick = (currentUsername || "user") + Math.floor(Math.random() * 10000);
    setSuggested(newNick);
    setName(newNick);
  };

  useEffect(() => {
    // Автозаполнение из localStorage
    if (!name && typeof window !== 'undefined') {
      const last = localStorage.getItem('username');
      if (last) setName(last);
    }
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg min-w-[320px]">
        <h3 className="text-lg font-semibold mb-2 text-white">Choose a nickname for the chat</h3>
        {error && (
          <div className="mb-2 text-red-400 text-sm">
            {error}
            {seconds > 0 && (
              <div className="mt-1 text-yellow-300">
                This nickname will be available through <b>{seconds}</b> сек.
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 px-3 py-2 rounded border border-gray-600 bg-gray-800 text-white"
            placeholder="Enter a new nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button
            className="bg-gray-700 text-gray-200 px-3 py-2 rounded hover:bg-gray-600"
            onClick={handleSuggest}
            type="button"
          >
            Random nick
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => onSubmit(name)}
            disabled={!name.trim()}
          >
            Use nick
          </button>
          {seconds > 0 && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => onSubmit(suggested)}
            >
              Temporarily occupy: {suggested}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsernameModal;
