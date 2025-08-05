import React, { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRealmChatSocket } from "../../hooks/useRealmChatSocket";
import UsernameModal from "./UsernameModal";
import { UsersPanel } from "./UsersPanel";
import { useTitleNotifications } from "../../hooks/useTitleNotifications";

interface RealmChatProps {
  realm: string;
  username: string;
  onUsernameSubmit: (username: string) => void;
  onChatMessage?: () => void;
  wait?: number | null;
}

/**
 * Обновлённый дизайн чата:
 * ─ единая цветовая схема (зелёный / серый / красный)
 * ─ статус‑индикатор в заголовке
 * ─ пузырьки сообщений (свои → зелёные, чужие → серые)
 * ─ более заметные кнопки и поля ввода
 */
const RealmChat: React.FC<RealmChatProps> = observer(
  ({ realm, username, onUsernameSubmit, onChatMessage, wait }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(!username);
    const [hasDuplicateError, setHasDuplicateError] = useState<boolean>(false);

    const { start: startTitleBlink, stop: stopTitleBlink } =
      useTitleNotifications();

    const {
      messages,
      sendMessage,
      userCount,
      onlineUsers,
      isConnected,
      connectionStatus,
      manualReconnect,
    } = useRealmChatSocket(realm, username, {
      onError: (msg) => {
        setError(msg);
        setShowModal(true);
        setHasDuplicateError(msg.includes("duplicate"));
      },
      onNewMessage: (entry) => {
        if (entry.user !== username) {
          onChatMessage?.();
          if (document.visibilityState !== "visible") {
            startTitleBlink();
          }
        }
      },
    });

    // handle duplicate‑name modal visibility
    useEffect(() => {
      if (error || hasDuplicateError) {
        setShowModal(true);
      }
    }, [error, hasDuplicateError]);

    // close modal and clear error on successful auth
    useEffect(() => {
      if (username && isConnected) {
        setError(null);
        setHasDuplicateError(false);
        setShowModal(false);
      }
    }, [username, isConnected]);

    // stop title blink when user focuses tab or interacts
    useEffect(() => {
      const stopBlinkOnFocus = () => {
        if (document.visibilityState === "visible") {
          stopTitleBlink();
        }
      };
      document.addEventListener("visibilitychange", stopBlinkOnFocus);
      return () => document.removeEventListener("visibilitychange", stopBlinkOnFocus);
    }, [stopTitleBlink]);

    const handleUsernameSubmit = useCallback(
      (name: string) => {
        setError(null);
        setHasDuplicateError(false);
        onUsernameSubmit(name);
      },
      [onUsernameSubmit]
    );

    const handleSend = useCallback(() => {
      if (text.trim()) {
        sendMessage(text.trim());
        setText("");
      }
    }, [text, sendMessage]);

    const handleChangeName = useCallback(() => {
      setError(null);
      setShowModal(true);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSend();
        }
      },
      [handleSend]
    );

    // auto‑scroll
    useEffect(() => {
      const c = scrollRef.current?.parentElement;
      if (c) c.scrollTop = c.scrollHeight;
    }, [messages]);

    /**
     * Цветной бейдж статуса подключений
     */
    const statusBadge = () => {
      const base = "px-2 py-0.5 rounded text-xs font-medium";
      switch (connectionStatus) {
        case "connecting":
          return <span className={`${base} bg-yellow-700 text-yellow-300`}>Connecting…</span>;
        case "reconnecting":
          return <span className={`${base} bg-orange-700 text-orange-300`}>Reconnecting…</span>;
        case "disconnected":
          return <span className={`${base} bg-red-700 text-red-300`}>Disconnected</span>;
        case "connected":
        default:
          return <span className={`${base} bg-green-700 text-green-300`}>Connected</span>;
      }
    };

    return (
      <div className="w-full mx-auto mt-4 mb-4 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-sm">
        {/* header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Realm Chat</h2>
            {statusBadge()}
          </div>
          <button
            onClick={handleChangeName}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-600 text-gray-300 transition-colors"
          >
            Change name
          </button>
        </div>

        {connectionStatus === "reconnecting" && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={manualReconnect}
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded"
            >
              Retry now
            </button>
            <span className="text-xs text-orange-400">Attempting to reconnect…</span>
          </div>
        )}

        {connectionStatus === "disconnected" && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={manualReconnect}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
            >
              Reconnect
            </button>
            <span className="text-xs text-yellow-500">Tip: avoid frequent page reloads</span>
          </div>
        )}

        {/* body */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* messages */}
          <div className="flex-1 flex flex-col">
            <div className="bg-black p-3 h-60 overflow-y-auto rounded border border-gray-600 space-y-2">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-10">
                  {connectionStatus === "connected"
                    ? "No messages yet"
                    : connectionStatus === "connecting"
                    ? "Connecting to chat…"
                    : connectionStatus === "reconnecting"
                    ? "Reconnecting to chat…"
                    : "Disconnected from chat"}
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.user === username;
                  return (
                    <div
                      key={`${msg.time}-${msg.user}`}
                      className={`flex flex-col max-w-full ${isOwn ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[10px] text-gray-500 mb-0.5">
                        {new Date(msg.time).toLocaleString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          hour12: false,
                        })}
                      </div>
                      <div
                        className={`px-3 py-1 max-w-[90vw] sm:max-w-[80%] break-words break-all rounded-lg shadow-sm text-sm
                          ${isOwn ? "bg-green-700 text-white" : "bg-gray-700 text-gray-100"}`}
                      >
                        <span className="font-semibold mr-1 truncate max-w-[100px] inline-block align-middle">{msg.user}:</span>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={
                  connectionStatus === "connecting"
                    ? "Connecting…"
                    : connectionStatus === "reconnecting"
                    ? "Reconnecting…"
                    : connectionStatus === "disconnected"
                    ? "Disconnected"
                    : "Enter your message…"
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isConnected}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || connectionStatus !== "connected"}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>

          {/* users panel */}
          <UsersPanel userCount={userCount} onlineUsers={onlineUsers} username={username} />
        </div>

        {/* username modal */}
        {showModal && (
          <UsernameModal error={error ?? undefined} wait={wait ?? undefined} onSubmit={handleUsernameSubmit} currentUsername={username} />
        )}
      </div>
    );
  }
);

export default RealmChat;
