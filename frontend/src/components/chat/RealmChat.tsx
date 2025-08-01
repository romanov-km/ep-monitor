import React, { useEffect, useRef, useState } from "react";
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
    const { messages, sendMessage } = useRealmChatSocket(realm, username);
    const [text, setText] = useState("");
    const [showModal, setShowModal] = useState(false);

    const handleFocus = () => {
      if (!username) setShowModal(true);
    };

    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
      if (text.trim()) {
        sendMessage(text.trim());
        setText("");
      }
    };

    return (
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg w-full  mx-auto mt-4 mb-4">
        <h2 className="text-lg font-bold text-white mb-2">Chat:</h2>

        <div className="bg-black p-2 h-60 overflow-y-auto rounded border border-gray-600">
          {messages.map((msg, idx) => {
            const isOwnMessage = msg.user === username;

            return (
              <div
                key={idx}
                className={`text-sm mb-1 flex flex-col ${
                  isOwnMessage
                    ? "text-green-400 items-end"
                    : "text-gray-300 items-start"
                }`}
              >
                <div className="text-xs text-gray-500">
                  {new Date(msg.time).toLocaleString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>
                <div className="max-w-xs break-words bg-gray-800 px-2 py-1 rounded">
                  <span className="font-semibold">{msg.user}</span>: {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="mt-2 flex">
          <input
            type="text"
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
            placeholder="Enter your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            onFocus={handleFocus}
          />
          <button
            disabled={!text.trim()}
            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-10"
            onClick={handleSend}
          >
            {text.trim() ? "Send" : "Enter your message"}
          </button>
        </div>

        {showModal && (
          <UsernameModal
            onSubmit={(name) => {
              onUsernameSubmit(name);
              setShowModal(false);
            }}
          />
        )}
      </div>
    );
  }
);

export default RealmChat;
