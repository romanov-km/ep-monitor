import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { translations } from "../locales";
import LanguageSwitcher from "../components/LanguageSwitcher"; // Компонент переключения языка
import TelegramBlock from "../components/TelegramBlock";
import StatusChart from "../components/StatusChart";
import StatusList from "../components/StatusList";
import SoundSettings from "../components/SoundSettings";
import Footer from "../components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { RealmStatusList } from "../components/RealmStatusList";
import { realmStore } from "../stores/realmStore";
import { autorun } from "mobx";
import RealmChat from "../components/chat/RealmChat";
import { parseStatus } from "../utils/parseStatus";
import IdleGame from "../components/game/IdleGame";
import { DebugPanel } from "../components/DebugPanel";
import { soundStore } from "../stores/soundStore"; // Импортируем новый store для звука

interface StatusEntry {
  time: string;
  status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [chartData, setChartData] = useState<
    { time: string; statusValue: number }[]
  >([]);

  const [language, setLanguage] = useState<"ru" | "en">("en");
  const t = translations[language];

  const [authStatusText, setAuthStatusText] = useState("");
  const isAuthUp =
    authStatusText.includes("🟢") || authStatusText.includes("UP");

  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );

  const [showTelegram, setShowTelegram] = useState(false);
  const prevStatusesRef = useRef<Record<string, boolean>>({});
  const prevAuthStatusRef = useRef<boolean>(false);

  const [showGame, setShowGame] = useState(false);
  const [miniGameStats, setMiniGameStats] = useState({
    level: 1,
    gold: 0,
    dps: 0,
  });

  const handleUsernameSubmit = (name: string) => {
    localStorage.setItem("username", name);
    setUsername(name);
  };

  // Отслеживаем взаимодействие пользователя с страницей
  useEffect(() => {
    const handleInteraction = () => {
      if (!soundStore.userInteracted) {
        console.log("👆 User interacted with page, audio enabled");
        soundStore.setUserInteracted(true);
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  useEffect(() => {
    const dispose = autorun(() => {
      realmStore.realms.forEach((realm) => {
        const isUp = parseStatus(realm); // true или false
        const prev = prevStatusesRef.current[realm.name];

        // Если сервер поднялся
        if (prev === false && isUp) {
          soundStore.play("realmUp");
        }

        // Если сервер упал
        if (prev === true && !isUp) {
          soundStore.play("realmDown");
        }

        // Сохраняем текущее состояние
        prevStatusesRef.current[realm.name] = isUp;
      });
    });

    return () => dispose();
  }, []);

  // Отслеживаем изменение статуса Auth сервера
  useEffect(() => {
    const prevAuthUp = prevAuthStatusRef.current;

    // Если Auth сервер поднялся
    if (!prevAuthUp && isAuthUp) {
      soundStore.play("authUp");
    }

    prevAuthStatusRef.current = isAuthUp;
  }, [isAuthUp, soundStore.soundSettings.authUp]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get<StatusEntry[]>(`${API_BASE}/api/status`);
      setStatuses(res.data);
      if (res.data.length > 0) {
        setAuthStatusText(res.data[res.data.length - 1].status);
      }
    } catch (err) {
      console.error("Ошибка загрузки статуса:", err);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "ru" || savedLang === "en") {
      setLanguage(savedLang);
    }
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    const list = document.getElementById("status-list");
    if (list) list.scrollTop = list.scrollHeight;
  }, [statuses]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/chart-events`);

        const transformed = res.data.map(
          (point: { time: string; statusValue: number }) => ({
            time: point.time,
            statusValue: point.statusValue,
          })
        );

        setChartData(transformed);
      } catch (err) {
        console.error("Ошибка загрузки данных для графика:", err);
      }
    };

    fetchChartData();
  }, []);

  return (
    <div className="p-4 font-mono max-w-screen-lg mx-auto">
      <SoundSettings />
      <div
        className={`p-2 rounded mb-4 text-sm ${isAuthUp
          ? "bg-green-700 text-white"
          : "bg-red-600 text-white animate-pulse"
          }`}
      >
        {language === "ru" ? (
          <>
            {isAuthUp ? t.authUp : t.authDown} {t.notifications}:{" "}
            {soundStore.soundSettings.realmUp.enabled ? "ВКЛ 🔔" : "ВЫКЛ 🔕"}
            {!soundStore.userInteracted && (
              <button
                onClick={() => soundStore.setUserInteracted(true)}
                className="ml-2 underline hover:no-underline"
              >
                (кликните для активации звука)
              </button>
            )}
          </>
        ) : (
          <>
            {isAuthUp ? t.authUp : t.authDown} {t.notifications}:{" "}
            {soundStore.soundSettings.realmUp.enabled && soundStore.userInteracted ? "ON 🔔" : "OFF 🔕"}
            {!soundStore.userInteracted && (
              <button
                onClick={() => soundStore.setUserInteracted(true)}
                className="ml-2 underline hover:no-underline"
              >
                (click to enable audio notifications)
              </button>
            )}
          </>
        )}
      </div>

      <h1 className="text-1xl font-bold mb-4">{t.title}</h1>

      <LanguageSwitcher language={language} setLanguage={setLanguage} />

      {showTelegram && <TelegramBlock t={t} language={language} />}

      <div className="my-2 flex gap-2 flex-wrap">
        <button
          onClick={() => setShowTelegram((prev) => !prev)}
          className="text-sm bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
        >
          {showTelegram ? t.tgHide : t.tgShow}
        </button>

        {showGame && (
          <div className="fixed bottom-4 right-4 w-[340px] max-h-[90vh] z-50 bg-gray-700 rounded shadow-lg overflow-hidden border border-gray-700 overflow-y-auto">
            <IdleGame
              onStatsUpdate={setMiniGameStats}
              language={language}
              onClose={() => setShowGame(false)}
            />
          </div>
        )}

        <button
          onClick={() => setShowGame((prev) => !prev)}
          className="text-sm bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded"
        >
          {showGame
            ? `${t.hideGame} — 🐉 ${miniGameStats.level} | 💰 ${miniGameStats.gold} | ⚔️ ${miniGameStats.dps}`
            : `${t.game} — 🐉 ${miniGameStats.level} | 💰 ${miniGameStats.gold} | ⚔️ ${miniGameStats.dps}`}
        </button>
      </div>

      <RealmStatusList />
      <RealmChat
        realm="Gurubashi PVP"
        username={username}
        onUsernameSubmit={handleUsernameSubmit}
        onChatMessage={() => {
          console.log("Chat message received, sound enabled:", soundStore.soundSettings.chat.enabled, "settings:", soundStore.soundSettings.chat);
          if (soundStore.soundSettings.chat.enabled) {
            soundStore.play("chat");
          } else {
            console.log("Chat sound is disabled, not playing");
          }
        }
        }
      />

      <StatusChart chartData={chartData} />

      <StatusList statuses={statuses} />

      <DebugPanel />

      <Footer t={t} />

      <SpeedInsights />

      <Analytics />
    </div>
  );
}

export default App;
