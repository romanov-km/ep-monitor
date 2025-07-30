import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { translations } from "./locales";
import LanguageSwitcher from "./components/LanguageSwitcher"; // Компонент переключения языка
import TelegramBlock from "./components/TelegramBlock";
import StatusChart from "./components/StatusChart";
import StatusList from "./components/StatusList";
import SoundSettings from "./components/SoundSettings";
import Footer from "./components/Footer";
import { Analytics } from '@vercel/analytics/react';

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
  const [chartData, setChartData] = useState<{ time: string; statusValue: number }[]>([]);

  const [language, setLanguage] = useState<"ru" | "en">("en");
  const t = translations[language];

  const [alertEnabled, setAlertEnabled] = useState(true);
  const [volume, setVolume] = useState(1);
  const [soundType, setSoundType] = useState("BG");

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        const res = await axios.get(`${API_BASE}/api/chart-data`);
  
        const toLocalHour = (utcString: string) => {
          // utcString = "2025-07-30 14"
          const [date, hour] = utcString.split(" ");
          const iso = `${date}T${hour.padStart(2, "0")}:00:00Z`; // ISO строка
          const local = new Date(iso);
        
          const month = String(local.getMonth() + 1).padStart(2, "0");
          const day = String(local.getDate()).padStart(2, "0");
          const hourLocal = String(local.getHours()).padStart(2, "0");
        
          return `${month}-${day} ${hourLocal}:00`;
        };
  
        const transformed = res.data.map((point: { time: string; statusValue: number }) => ({
          time: toLocalHour(point.time),
          statusValue: point.statusValue,
        }));
  
        setChartData(transformed);
      } catch (err) {
        console.error("Ошибка загрузки данных для графика:", err);
      }
    };
  
    fetchChartData();
  }, []);

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
        stopSound={stopSound}
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

      <Footer t={t}/>

      <Analytics />
    </div>
  );
}

export default App;
