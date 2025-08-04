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
  maxReconnectAttempts?: number;
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
  const heartbeatTimeoutRef = useRef<number | null>(null);
  const { onError } = options || {};
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const reconnectBlockedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options?.maxReconnectAttempts ?? 10;

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

  const clearAllTimers = () => {
    clearInterval(pingIntervalRef.current!);
    clearTimeout(reconnectTimeoutRef.current!);
    clearTimeout(heartbeatTimeoutRef.current!);
    pingIntervalRef.current = null;
    reconnectTimeoutRef.current = null;
    heartbeatTimeoutRef.current = null;
  };

  const connect = () => {
    if (!realm || !username) return;
    
    // Проверяем лимит попыток переподключения в самом начале
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error("🚫 Max reconnection attempts reached");
      setConnectionStatus('disconnected');
      onError?.("Превышено максимальное количество попыток переподключения");
      return;
    }
    
    // Проверяем, не создаем ли мы уже соединение
    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      console.log("⚠️ Connection already in progress, skipping...");
      return;
    }
    
    // Если сокет существует, но уже закрыт - очищаем его
    if (socketRef.current && socketRef.current.readyState === WebSocket.CLOSED) {
      console.log("🧹 Cleaning up closed socket");
      socketRef.current = null;
    }

    setConnectionStatus('connecting');
    reconnectBlockedRef.current = false;

    // Очищаем предыдущее соединение
    safeClose();
    clearAllTimers();

    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0; // Сбрасываем счетчик при успешном подключении
      console.log("✅ WebSocket connected successfully");
      console.log("📤 Sending subscription for realm:", realm, "username:", username);
      socket.send(JSON.stringify({ type: "subscribe", realm, username }));

      // пинги только когда сокет открыт
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          console.log("💓 Sending ping to server");
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, options?.pingInterval ?? 60_000); // 60 секунд (было 30_000)
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "error":
          console.error("Server error:", data.message, "Code:", data.code);
          if (data.code === "duplicate_nick") {
            console.warn("🚫 Duplicate nickname detected, blocking reconnection");
            reconnectBlockedRef.current = true;
            // Увеличиваем задержку при ошибке дублирования ника
            setTimeout(() => {
              onError?.(data.message);
              safeClose();
            }, 2000); // Увеличиваем с 100ms до 2000ms
          } else if (data.code === "rapid_reconnect") {
            console.warn("🚫 Rapid reconnection detected, adding delay");
            // Добавляем задержку при частых переподключениях
            setTimeout(() => {
              onError?.(data.message);
              safeClose();
            }, 3000); // 3 секунды задержки
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
        case "subscribe_success":
          // Успешная подписка - сбрасываем флаг блокировки
          reconnectBlockedRef.current = false;
          break;
        case "heartbeat":
          // Отвечаем на heartbeat от сервера
          console.log("💓 Received heartbeat from server, sending pong");
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "pong" }));
          }
          break;
        case "pong":
          // Сервер ответил на наш ping
          console.log("💓 Received pong from server");
          break;
      }
    };

    socket.onclose = (event) => {
      console.warn("❌ WebSocket closed", event.code, event.reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      clearAllTimers();
      
      // Очищаем ссылку на сокет
      socketRef.current = null;
      
      // Не переподключаемся при graceful shutdown сервера
      if (event.code === 1000 && event.reason === 'Server shutdown') {
        console.log("🛑 Server is shutting down, not reconnecting");
        onError?.("Сервер выключается");
        return;
      }
      
      // реконект только если не заблокирован и нет активного таймаута
      if (!reconnectTimeoutRef.current && !reconnectBlockedRef.current) {
        reconnectAttemptsRef.current++;
        setConnectionStatus('reconnecting');
        
        // Экспоненциальная задержка: 1s, 2s, 4s, 8s, 16s, 30s, 30s...
        const baseDelay = options?.reconnectDelay ?? 1000;
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
        
        console.log(`🔁 Reconnecting WebSocket... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}, delay: ${delay}ms)`);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      }
    };

    socket.onerror = (err) => {
      console.error("🛑 WebSocket error:", err);
      setConnectionStatus('disconnected');
      
      // При ошибке соединения также запускаем переподключение
      if (!reconnectTimeoutRef.current && !reconnectBlockedRef.current) {
        reconnectAttemptsRef.current++;
        setConnectionStatus('reconnecting');
        
        // Экспоненциальная задержка: 1s, 2s, 4s, 8s, 16s, 30s, 30s...
        const baseDelay = options?.reconnectDelay ?? 1000;
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
        
        console.log(`🔁 Reconnecting after error... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}, delay: ${delay}ms)`);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      }
      
      safeClose();
    };
  };

  useEffect(() => {
    // Очищаем предыдущее соединение
    safeClose();
    clearAllTimers();
    
    // Сбрасываем состояние
    setMessages([]);
    setOnlineUsers([]);
    setUserCount(0);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    // Сбрасываем флаги
    reconnectBlockedRef.current = false;
    reconnectAttemptsRef.current = 0;
    
    // Устанавливаем небольшую задержку перед подключением
    const timeoutId = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      safeClose();
      clearAllTimers();
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

  const manualReconnect = () => {
    // Очищаем все таймауты и интервалы
    clearAllTimers();
    
    // Сбрасываем счетчик попыток
    reconnectAttemptsRef.current = 0;
    
    // Очищаем ссылку на сокет
    socketRef.current = null;
    
    // Сбрасываем флаг блокировки
    reconnectBlockedRef.current = false;
    
    console.log("🔄 Manual reconnect initiated");
    connect();
  };

  return { 
    messages, 
    sendMessage, 
    userCount, 
    onlineUsers, 
    isConnected, 
    connectionStatus,
    manualReconnect 
  };
};
