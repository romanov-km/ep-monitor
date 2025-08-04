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
// import RealmCharts from "../components/RealmCharts";

interface StatusEntry {
  time: string;
  status: string;
}

interface SoundEvent {
  enabled: boolean;
  soundType: string;
  volume: number;
}

interface AppSoundSettings {
  realmUp: SoundEvent;
  authUp: SoundEvent;
  chat: SoundEvent;
}

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [chartData, setChartData] = useState<
    { time: string; statusValue: number }[]
  >([]);

  const [language, setLanguage] = useState<"ru" | "en">("en");
  const t = translations[language];

  // Новая система настроек звука
  const [soundSettings, setSoundSettings] = useState<AppSoundSettings>(() => {
    const saved = localStorage.getItem("soundSettings");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      realmUp: { enabled: true, soundType: "70elite", volume: 1 },
      authUp: { enabled: true, soundType: "levelup", volume: 1 },
      chat: { enabled: true, soundType: "newmsg", volume: 0.6 },
    };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Состояние для отслеживания взаимодействия пользователя с страницей
  const [userInteracted, setUserInteracted] = useState(false);

  const handleUsernameSubmit = (name: string) => {
    localStorage.setItem("username", name);
    setUsername(name);
  };



  const playSound = (eventType: keyof AppSoundSettings) => {
    const event = soundSettings[eventType];
    console.log(`Playing sound for ${eventType}:`, event);
    if (!event.enabled) {
      console.log(`Sound ${eventType} is disabled`);
      return;
    }

    // Проверяем, взаимодействовал ли пользователь с страницей
    if (!userInteracted) {
      console.log("🔇 Audio blocked: user hasn't interacted with page yet");
      return;
    }

    // Останавливаем предыдущий звук, если он играет
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Загружаем новый звук с задержкой, чтобы избежать перезагрузки звука
    
      const audioPath = `/sounds/${event.soundType}${event.soundType === 'newmsg' ? '.ogg' : '.mp3'}`;
      console.log(`Loading audio from: ${audioPath}`);
      const audio = new Audio(audioPath);
      audio.volume = event.volume;
      audioRef.current = audio;
  
      audio
        .play()
        .then(() => console.log(`Successfully playing ${eventType} sound`))
        .catch((err) => {
          console.error("Ошибка при воспроизведении звука:", err);
          if (err.name === 'NotAllowedError') {
            console.log("🔇 Audio blocked by browser policy - user needs to interact first");
          }
        });

  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playTestSound = (eventType: keyof AppSoundSettings) => {
    playSound(eventType);
  };

  // Сохраняем настройки звука в localStorage
  useEffect(() => {
    localStorage.setItem("soundSettings", JSON.stringify(soundSettings));
  }, [soundSettings]);

  // Отслеживаем взаимодействие пользователя с страницей
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        console.log("👆 User interacted with page, audio enabled");
        setUserInteracted(true);
      }
    };

    // События, которые считаются взаимодействием
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [userInteracted]);

  // Слушаем изменения в localStorage для синхронизации настроек звука
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "soundSettings" && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSoundSettings(newSettings);
        } catch (error) {
          console.error("Error parsing sound settings from localStorage:", error);
        }
      }
    };

    // Слушаем изменения localStorage из других вкладок
    window.addEventListener("storage", handleStorageChange);

    // Также проверяем localStorage периодически для изменений в той же вкладке
    const interval = setInterval(() => {
      const saved = localStorage.getItem("soundSettings");
      if (saved) {
        try {
          const parsed = JSON.stringify(soundSettings);
          if (saved !== parsed) {
            const newSettings = JSON.parse(saved);
            console.log("Updating sound settings from localStorage:", newSettings);
            setSoundSettings(newSettings);
          }
        } catch (error) {
          console.error("Error checking sound settings:", error);
        }
      }
    }, 1000); // Проверяем каждую секунду

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [soundSettings]);

  useEffect(() => {
    const dispose = autorun(() => {
      realmStore.realms.forEach((realm) => {
        const isUp = parseStatus(realm); // true или false
        const prev = prevStatusesRef.current[realm.name];

        // Если сервер поднялся
        if (prev === false && isUp) {
          playSound("realmUp");
        }

        // Сохраняем текущее состояние
        prevStatusesRef.current[realm.name] = isUp;
      });
    });

    return () => dispose();
  }, [soundSettings.realmUp]);

  // Отслеживаем изменение статуса Auth сервера
  useEffect(() => {
    const prevAuthUp = prevAuthStatusRef.current;
    
    // Если Auth сервер поднялся
    if (!prevAuthUp && isAuthUp) {
      playSound("authUp");
    }
    
    prevAuthStatusRef.current = isAuthUp;
  }, [isAuthUp, soundSettings.authUp]);

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
    <div className="p-4 font-mono">
      <SoundSettings
        soundSettings={soundSettings}
        setSoundSettings={setSoundSettings}
        playTestSound={playTestSound}
        stopSound={stopSound}
      />
      <div
        className={`p-2 rounded mb-4 text-sm ${
          isAuthUp
            ? "bg-green-700 text-white"
            : "bg-red-600 text-white animate-pulse"
        }`}
      >
        {language === "ru" ? (
          <>
            {isAuthUp ? t.authUp : t.authDown} {t.notifications}:{" "}
            {soundSettings.realmUp.enabled ? "ВКЛ 🔔" : "ВЫКЛ 🔕"}
            {!userInteracted && (
              <button
                onClick={() => setUserInteracted(true)}
                className="ml-2 underline hover:no-underline"
              >
                (кликните для активации звука)
              </button>
            )}
          </>
        ) : (
          <>
            {isAuthUp ? t.authUp : t.authDown} {t.notifications}:{" "}
            {soundSettings.realmUp.enabled && userInteracted ? "ON 🔔" : "OFF 🔕"}
            {!userInteracted && (
              <button
                onClick={() => setUserInteracted(true)}
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
          <div className="fixed bottom-4 right-4 w-[340px] h-[700px] z-50 bg-gray-800 rounded shadow-lg overflow-hidden border border-gray-700">
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
          console.log("Chat message received, sound enabled:", soundSettings.chat.enabled, "settings:", soundSettings.chat);
          if (soundSettings.chat.enabled) {
            playSound("chat");
          } else {
            console.log("Chat sound is disabled, not playing");
          }
        }}
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
