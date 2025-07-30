// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { translations } from "./locales";
import LanguageSwitcher from "./components/LanguageSwitcher"; // Компонент переключения языка
import TelegramBlock from "./components/TelegramBlock";
import StatusChart from "./components/StatusChart";
import StatusList from "./components/StatusList";
import SoundSettings from "./components/SoundSettings";

interface StatusEntry {
  time: string;
  status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE;

// Унифицированная функция для определения, что сервер работает
function parseStatus(entry: StatusEntry): boolean {
  return (
    entry.status.toUpperCase().includes("UP") || entry.status.includes("🟢")
  );
}

function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const t = translations[language];

  const [alertEnabled, setAlertEnabled] = useState(true);
  const [volume, setVolume] = useState(1);
  const [soundType, setSoundType] = useState("default");

  const playSound = () => {
    const audio = new Audio(`/sounds/${soundType}.mp3`);
    audio.volume = volume;
    audio
      .play()
      .catch((err) => console.error("Ошибка при воспроизведении звука:", err));
  };

  const playTestSound = () => {
    if (alertEnabled) playSound();
  };

  const prevStatusRef = useRef<boolean | null>(null);

  useEffect(() => {
    const latest = statuses[0];
    if (!latest) return;

    const current = parseStatus(latest);
    const prev = prevStatusRef.current;

    if (prev === false && current === true && alertEnabled) {
      playSound();
    }

    prevStatusRef.current = current;
  }, [statuses, alertEnabled]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get<StatusEntry[]>(`${API_BASE}/api/status`);
      setStatuses(res.data);
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
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    const list = document.getElementById("status-list");
    if (list) list.scrollTop = list.scrollHeight;
  }, [statuses]);

  const chartData = useMemo(() => {
    return statuses
      .map((entry) => {
        const rawDate = entry.time;
        const rawTime = entry.status.slice(0, 8);
        const utcString = `${rawDate}T${rawTime}Z`;
        const localDate = new Date(utcString);

        const formatted = `${String(localDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(localDate.getDate()).padStart(2, "0")} ${localDate
          .getHours()
          .toString()
          .padStart(2, "0")}:${localDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        return {
          time: formatted,
          statusValue: parseStatus(entry) ? 1 : 0,
        };
      })
      .reverse();
  }, [statuses]);

  const latestStatusEntry = statuses[0];
  const isServerUp = latestStatusEntry ? parseStatus(latestStatusEntry) : false;

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
      />

      <h1 className="text-1xl font-bold mb-4">{t.title}</h1>

      <LanguageSwitcher language={language} setLanguage={setLanguage} />

      <TelegramBlock t={t} language={language} />

      <p className="text-sm">
        🔄 {t.lastStatus}:{" "}
        <span className={isServerUp ? "text-green-400" : "text-red-400"}>
          {isServerUp ? t.up : t.down}
        </span>
      </p>

      <StatusChart chartData={chartData} />

      <StatusList statuses={statuses} />
    </div>
  );
}

export default App;
