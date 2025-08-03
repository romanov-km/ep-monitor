// hooks/useTitleNotifications.ts
import { useEffect, useRef } from "react";

export const useTitleNotifications = () => {
  const originalTitleRef = useRef(document.title);
  const intervalRef = useRef<number | null>(null);

  /** запустить мигание "(1) New chat" */
  const start = () => {
    if (intervalRef.current) return;            // уже мигаем
    originalTitleRef.current = document.title;  // запомним текущий
    let toggle = false;

    intervalRef.current = window.setInterval(() => {
      document.title = toggle ? "(1) New chat" : originalTitleRef.current;
      toggle = !toggle;
    }, 1000);
  };

  /** остановить мигание и вернуть исходный title */
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      document.title = originalTitleRef.current;
    }
  };

  /** при переходе пользователя на вкладку — остановить */
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        stop();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return { start, stop };
};
