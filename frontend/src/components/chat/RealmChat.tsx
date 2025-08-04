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
}

const RealmChat: React.FC<RealmChatProps> = observer(
  ({ realm, username, onUsernameSubmit, onChatMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState("");

    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState<boolean>(!username);
    const [hasDuplicateError, setHasDuplicateError] = useState<boolean>(false);

    const { start: startTitleBlink, stop: stopTitleBlink } =
      useTitleNotifications();

    const { messages, sendMessage, userCount, onlineUsers, isConnected, connectionStatus, manualReconnect } =
      useRealmChatSocket(realm, username, {
        onError: (msg) => {
          // Показываем модал только для ошибок дублирования ника
          if (msg.includes("duplicate")) {
            setError(msg);
            setShowModal(true);
            setHasDuplicateError(true);
            
            // Принудительно обновляем состояние несколько раз
            setTimeout(() => {
              setShowModal(true);
            }, 100);
            setTimeout(() => {
              setShowModal(true);
            }, 500);
            setTimeout(() => {
              setShowModal(true);
            }, 1000);
          } else {
            // Для других ошибок только логируем, но не показываем модал
            console.warn("Chat error:", msg);
          }
        },
        onNewMessage: (entry) => {
          if (entry.user !== username) {
            console.log("RealmChat: new message from", entry.user, "calling onChatMessage");
            // Вызываем callback для воспроизведения звука
            onChatMessage?.();
        
            if (document.visibilityState !== "visible") {
              startTitleBlink();
            }
          }
        },
      });

    // Показать модал при ошибке
    useEffect(() => {
      if (error || hasDuplicateError) {
        setShowModal(true);
      }
    }, [error, hasDuplicateError, showModal]);

    // Закрыть модал при успешном вводе имени
    useEffect(() => {
      if (username && !error && isConnected) {
        setError(null);
        setHasDuplicateError(false);
        setShowModal(false);
      }
    }, [username, error, isConnected]);



    // Остановить мигание при фокусе на вкладке
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          stopTitleBlink();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [stopTitleBlink]);

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

    // когда пользователь открыл чат или отправил своё сообщение — остановить мигание
    useEffect(() => {
      stopTitleBlink();
    }, [messages, stopTitleBlink]);

    //скрол чата при новых сообщениях
    useEffect(() => {
      const container = scrollRef.current?.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, [messages]);

    return (
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg w-full  mx-auto mt-4 mb-4">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold text-white">Chat:</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-xs text-gray-300 rounded"
              onClick={handleChangeName}
            >
              Change name
            </button>
          </div>
        </div>
        {connectionStatus === 'connecting' && (
          <span className="text-xs text-yellow-500">🔄 Connecting...</span>
        )}
        {connectionStatus === 'reconnecting' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-orange-500">🔄 Reconnecting...</span>
            <button
              onClick={manualReconnect}
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded"
            >
              Retry now
            </button>
          </div>
        )}
        {connectionStatus === 'disconnected' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500">❌ Disconnected</span>
            <button
              onClick={manualReconnect}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
            >
              Reconnect
            </button>
            <span className="text-xs text-yellow-500">
              💡 Tip: Don't refresh the page frequently
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col">
            <div className="bg-black p-2 h-60 overflow-y-auto rounded border border-gray-600">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-10">
                  {connectionStatus === 'connected' ? "No messages yet" : 
                   connectionStatus === 'connecting' ? "Connecting to chat..." :
                   connectionStatus === 'reconnecting' ? "Reconnecting to chat..." :
                   "Disconnected from chat"}
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
                  connectionStatus === 'connecting' ? "Connecting..." :
                  connectionStatus === 'reconnecting' ? "Reconnecting..." :
                  connectionStatus === 'disconnected' ? "Disconnected" :
                  "Enter your message..."
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isConnected}
              />
              <button
                disabled={!text.trim() || connectionStatus !== 'connected'}
                className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-10"
                onClick={handleSend}
              >
                {text.trim() ? "Send" : "Enter your message"}
              </button>
            </div>
          </div>

          <UsersPanel
            userCount={userCount}
            onlineUsers={onlineUsers}
            username={username}
          />

          {showModal && (
            <UsernameModal
              error={error}
              onSubmit={handleUsernameSubmit}
              currentUsername={username}
            />
          )}
        </div>
      </div>
    );
  }
);

export default RealmChat;
