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

interface StatusEntry {
  time: string;
  status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE;

// Унифицированная функция для определения, что сервер работает
function parseStatus(entry: { status: string }) {
  return (
    entry.status.toUpperCase().includes("UP") || entry.status.includes("🟢")
  );
}

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [chartData, setChartData] = useState<
    { time: string; statusValue: number }[]
  >([]);

  const [language, setLanguage] = useState<"ru" | "en">("en");
  const t = translations[language];

  const [alertEnabled, setAlertEnabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [soundType, setSoundType] = useState("70elite");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [authStatusText, setAuthStatusText] = useState("");
  const isAuthUp =
    authStatusText.includes("🟢") || authStatusText.includes("UP");

  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );

  const [showTelegram, setShowTelegram] = useState(false);

  const handleUsernameSubmit = (name: string) => {
    localStorage.setItem("username", name);
    setUsername(name);
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(`/sounds/${soundType}.mp3`);
    audio.volume = volume;
    audioRef.current = audio;

    audio
      .play()
      .catch((err) => console.error("Ошибка при воспроизведении звука:", err));
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playTestSound = () => {
    if (alertEnabled) playSound();
  };

  const prevStatusRef = useRef<boolean | null>(null);

  useEffect(() => {
    const dispose = autorun(() => {
      const latest = realmStore.realms[0];
      if (!latest) return;

      const current = parseStatus(latest);
      const prev = prevStatusRef.current;

      if (prev === false && current === true && alertEnabled) {
        playSound();
      }

      prevStatusRef.current = current;
    });

    return () => dispose();
  }, [alertEnabled]);

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
        alertEnabled={alertEnabled}
        setAlertEnabled={setAlertEnabled}
        volume={volume}
        setVolume={setVolume}
        soundType={soundType}
        setSoundType={setSoundType}
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
            {isAuthUp
              ? "✅ Сервер авторизации работает."
              : "🚨 Сервер авторизации недоступен."}{" "}
            Уведомления: {alertEnabled ? "ВКЛ 🔔" : "ВЫКЛ 🔕"}
          </>
        ) : (
          <>
            {isAuthUp ? "✅ Authserver is UP." : "🚨 Authserver is DOWN."}{" "}
            Notifications: {alertEnabled ? "ON 🔔" : "OFF 🔕"}
          </>
        )}
      </div>

      <h1 className="text-1xl font-bold mb-4">{t.title}</h1>

      <LanguageSwitcher language={language} setLanguage={setLanguage} />

      <div className="my-2">
        <button
          onClick={() => setShowTelegram((prev) => !prev)}
          className="text-sm bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
        >
          {showTelegram ? "Hide Telegram-bot" : "Show Telegram-bot"}
        </button>
      </div>
      {showTelegram && <TelegramBlock t={t} language={language} />}

      <RealmStatusList />
      <RealmChat
        realm="Gurubashi PVP"
        username={username}
        onUsernameSubmit={handleUsernameSubmit}
      />

      <StatusChart chartData={chartData} />

      <StatusList statuses={statuses} />

      <Footer t={t} />

      <SpeedInsights />

      <Analytics />
    </div>
  );
}

export default App;
