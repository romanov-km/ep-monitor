import { useEffect, useRef, useState } from "react";

interface ChatEntry {
  time: string;
  realm: string;
  user: string;
  text: string;
}

export const useRealmChatSocket = (realm: string, username: string) => {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!realm || !username) return;

    const socket = new WebSocket(import.meta.env.VITE_WS_URL); // пример: "ws://localhost:8080"
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "subscribe", realm }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "history") {
        setMessages(data.entries);
      }

      if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.entry]);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      socket.close();
    };
  }, [realm, username]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ realm, user: username, text }));
    }
  };

  return { messages, sendMessage };
};
