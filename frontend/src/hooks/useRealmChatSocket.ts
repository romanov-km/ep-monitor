import { useEffect, useRef, useState } from "react";

interface ChatEntry {
  time: string;
  realm: string;
  user: string;
  text: string;
}

interface UseRealmChatSocketOptions {
  onError?: (message: string) => void;
  onNewMessage: (entry: ChatEntry) => void;
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
    if (sock) {
      // Убираем обработчики событий перед закрытием
      sock.onclose = null;
      sock.onerror = null;
      sock.onmessage = null;
      sock.onopen = null;
      
      if (
        sock.readyState === WebSocket.OPEN ||
        sock.readyState === WebSocket.CONNECTING
      ) {
        sock.close();
      }
    }
    socketRef.current = null;
  };

  const connect = () => {
    if (!realm || !username) return;
    
    // Проверяем, не создаем ли мы уже соединение
    if (socketRef.current) {
      console.log("⚠️ Connection already exists, skipping...");
      return;
    }

    reconnectBlockedRef.current = false;

    // Очищаем предыдущее соединение
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

      switch (data.type) {
        case "error":
          console.error("Server error:", data.message);
          if (data.code === "duplicate_nick") {
            reconnectBlockedRef.current = true;
            // Задержка перед закрытием для обработки ошибки
            setTimeout(() => {
              onError?.(data.message);
              safeClose();
            }, 100);
          } else {
            onError?.(data.message);
            safeClose();
          }
          break;
        case "history":
          setMessages(data.entries);
          break;
        case "new_message":
          setMessages((prev) => [...prev, data.entry]);
          options?.onNewMessage?.(data.entry);
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
      
      // реконект только если не заблокирован и нет активного таймаута
      if (!reconnectTimeoutRef.current && !reconnectBlockedRef.current && socketRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log("🔁 Reconnecting WebSocket...");
          reconnectTimeoutRef.current = null;
          connect();
        }, 1000);
      }
    };

    socket.onerror = (err) => {
      console.error("🛑 WebSocket error:", err);
      safeClose();
    };
  };

  useEffect(() => {
    // Очищаем предыдущее соединение
    safeClose();
    clearInterval(pingIntervalRef.current!);
    clearTimeout(reconnectTimeoutRef.current!);
    
    // Сбрасываем состояние
    setMessages([]);
    setOnlineUsers([]);
    setUserCount(0);
    setIsConnected(false);
    
    // Сбрасываем флаг блокировки реконнекта
    reconnectBlockedRef.current = false;
    
    // Устанавливаем небольшую задержку перед подключением
    const timeoutId = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
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
