import { useEffect, useRef, useState } from "react";

interface ChatEntry {
  time: string;
  realm: string;
  user: string;
  text: string;
}

interface UseRealmChatSocketOptions {
  onError?: (message: string) => void;
  pingInterval?: number;
  reconnectDelay?: number;
}

export const useRealmChatSocket = (
  realm: string,
  username: string,
  options?: UseRealmChatSocketOptions
) => {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const { onError } = options || {};
  const [isConnected, setIsConnected] = useState(false);
  const reconnectBlockedRef = useRef(false);

  const safeClose = () => {
    const sock = socketRef.current;
    if (
      sock &&
      (sock.readyState === WebSocket.OPEN ||
        sock.readyState === WebSocket.CONNECTING)
    ) {
      sock.close();
    }
  };

  const connect = () => {
    if (!realm || !username) return;

    reconnectBlockedRef.current = false;

    // Дубликат соединения
    safeClose();
    clearInterval(pingIntervalRef.current!);
    clearTimeout(reconnectTimeoutRef.current!);

    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log("✅ WebSocket connected");
      socket.send(JSON.stringify({ type: "subscribe", realm, username }));

      // пинги только когда сокет открыт
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, options?.pingInterval ?? 30_000);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "error" && data.code === "duplicate_nick") {
          reconnectBlockedRef.current = true;
         }

      switch (data.type) {
        case "error":
        console.error("Server error:", data.message);
        if (data.code === "duplicate_nick") {
          //reconnectBlocked = true;
          reconnectBlockedRef.current = true;
        }
        onError?.(data.message);
        safeClose();
        break;
        case "history":
          setMessages(data.entries);
          break;
        case "new_message":
          setMessages((prev) => [...prev, data.entry]);
          break;
        case "user_count":
          setUserCount(data.count);
          break;
        case "online_users":
          setOnlineUsers(data.users);
          break;
      }
    };

    socket.onclose = () => {
      console.warn("❌ WebSocket closed");
      setIsConnected(false);
      clearInterval(pingIntervalRef.current!);
      // реконект
      if (!reconnectTimeoutRef.current && !reconnectBlockedRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log("🔁 Reconnecting WebSocket...");
          connect();
          reconnectTimeoutRef.current = null;
        }, 1000);
      }
    };

    socket.onerror = (err) => {
      console.error("🛑 WebSocket error:", err);
      safeClose();
    };
  };

  useEffect(() => {
    
    setMessages([]);
    setOnlineUsers([]);
    setUserCount(0);
    setIsConnected(false);
    
    connect();

    return () => {
      safeClose();
      clearInterval(pingIntervalRef.current!);
      clearTimeout(reconnectTimeoutRef.current!);
    };
  }, [realm, username]);

  const sendMessage = (text: string) => {
    const sock = socketRef.current;
    if (sock?.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ realm, user: username, text }));
    } else {
      console.warn("Cannot send message — socket not open.");
    }
  };

  return { messages, sendMessage, userCount, onlineUsers, isConnected };
};
