import { useEffect, useRef, useState } from "react";

interface ChatEntry {
  time: string;
  realm: string;
  user: string;
  text: string;
}

interface UseRealmChatSocketOptions {
  onError?: (message: string) => void;
}

export const useRealmChatSocket = (realm: string, username: string, options?: UseRealmChatSocketOptions) => {
    const [messages, setMessages] = useState<ChatEntry[]>([]);
    const [userCount, setUserCount] = useState(0); // 👥 добавили
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const pingIntervalRef = useRef<number | null>(null);
    const { onError } = options || {};
  
    const connect = () => {
      if (!realm || !username) return;
  
      const socket = new WebSocket(import.meta.env.VITE_WS_URL);
      socketRef.current = socket;
  
      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        socket.send(JSON.stringify({ type: "subscribe", realm, username }));
  
        pingIntervalRef.current = setInterval(() => {
          socket.send(JSON.stringify({ type: "ping" }));
        }, 30000);
      };
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
  
        if (data.type === "history") {
          setMessages(data.entries);
        }
  
        if (data.type === "new_message") {
          setMessages((prev) => [...prev, data.entry]);
        }
  
        if (data.type === "user_count") {
          setUserCount(data.count); 
        }
        if (data.type === "online_users") {
          setOnlineUsers(data.users);
        }
        if (data.type === "error") {
          console.error("Ошибка от сервера:", data.message);
          if (onError) onError(data.message);
          socket.close();
        }
      };
  
      socket.onclose = () => {
        console.warn("❌ WebSocket closed");
        clearInterval(pingIntervalRef.current!);
        reconnect();
      };
  
      socket.onerror = (error) => {
        console.error("🛑 WebSocket error:", error);
        socket.close();
      };
      
    };
  
    const reconnect = () => {
      if (reconnectTimeoutRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("🔁 Reconnecting WebSocket...");
        connect();
        reconnectTimeoutRef.current = null;
      }, 3000);
    };
  
    useEffect(() => {
      connect();
  
      return () => {
        socketRef.current?.close();
        clearTimeout(reconnectTimeoutRef.current!);
        clearInterval(pingIntervalRef.current!);
      };
    }, [realm, username]);
  
    const sendMessage = (text: string) => {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ realm, user: username, text }));
      }
    };
  
    return { messages, sendMessage, userCount, onlineUsers };
  };
  