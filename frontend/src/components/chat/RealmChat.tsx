import React, { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRealmChatSocket } from "../../hooks/useRealmChatSocket";
import UsernameModal from "./UsernameModal";

interface RealmChatProps {
  realm: string;
  username: string;
  onUsernameSubmit: (username: string) => void;
}

const RealmChat: React.FC<RealmChatProps> = observer(
  ({ realm, username, onUsernameSubmit }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState("");

    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState<boolean>(!username);

    const { messages, sendMessage, userCount, onlineUsers, isConnected } =
      useRealmChatSocket(realm, username, {
        onError: (msg) => {
          if (msg.includes("дубликат")) {
            setShowModal(true);
          }
          setError(msg);
          setShowModal(true);
        },
      });

    // Закрыть модал при успешном вводе имени
    useEffect(() => {
      if (username && !error && isConnected) {
        setError(null);
        setShowModal(false);
      }
    }, [username, error, isConnected]);

    // Обработчик сохранения ника из модалки
    const handleUsernameSubmit = useCallback(
      (name: string) => {
        setError(null);
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

    useEffect(() => {
      const container = scrollRef.current?.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, [messages]);

    return (
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg w-full  mx-auto mt-4 mb-4">
        <h2 className="text-lg font-bold text-white mb-2">Chat:</h2>
        {!isConnected && (
          <span className="text-xs text-yellow-500">Connecting...</span>
        )}
        <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
          <div >
            👥 In chat: {userCount}
            {onlineUsers.length > 0 && (
              <div className="mt-1 text-xs text-gray-400">
                {onlineUsers.map((u, i) => (
                  <span
                    key={i}
                    className={
                      u === username ? "text-green-400 font-semibold" : ""
                    }
                  >
                    {u}
                    {i < onlineUsers.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка смены ника */}
          <button
            className="ml-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-xs text-gray-300 rounded"
            onClick={handleChangeName}
          >
            Change name
          </button>
        </div>
        <div className="bg-black p-2 h-60 overflow-y-auto rounded border border-gray-600">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center py-10">
              {isConnected ? "No messages yet" : "Connecting to chat..."}
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.user === username;

              return (
                <div
                  key={`${msg.time}-${msg.user}`}
                  className={`text-sm mb-1 flex flex-col ${
                    isOwnMessage
                      ? "text-green-400 items-end"
                      : "text-gray-300 items-start"
                  }`}
                >
                  <div className="text-xs text-gray-500">
                    {new Date(msg.time).toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      hour12: false,
                    })}
                  </div>
                  <div className="max-w-xs break-words bg-gray-800 px-2 py-1 rounded">
                    <span className="font-semibold">{msg.user}</span>:{" "}
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
        <div className="mt-2 flex">
          <input
            type="text"
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
            placeholder={
              !isConnected ? "Connecting..." : "Enter your message..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
          />
          <button
            disabled={!text.trim() || !isConnected}
            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-10"
            onClick={handleSend}
          >
            {text.trim() ? "Send" : "Enter your message"}
          </button>
        </div>
        {showModal && (
          <UsernameModal
            error={error}
            onSubmit={handleUsernameSubmit}
            currentUsername={username}
          />
        )}
      </div>
    );
  }
);

export default RealmChat;
