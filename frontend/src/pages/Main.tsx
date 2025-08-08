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
import { observer } from "mobx-react-lite";
import PatchVersion from "../components/PatchVersion";
import PatchModal from "../components/PatchModal";
import { Helmet } from "react-helmet";
import { BackgroundPicker } from "../components/BackgroundPicker";
import DonateCard from "../components/DonateCard";
import VisibilityToggles from "../components/VisibilityToggles";

interface StatusEntry {
  time: string;
  status: string;
}

interface PatchInfo {
  version: string | null;
  checked_at: string | null;
  changed_at: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE;

const App = observer(function App() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [chartData, setChartData] = useState<
    { time: string; statusValue: number }[]
  >([]);

  const [patchInfo, setPatchInfo] = useState<PatchInfo>({
    version: null,
    checked_at: null,
    changed_at: null,
  });
  const [showPatchBanner, setShowPatchBanner] = useState(false);

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
  
  // рядом с другими useState:
const [visible, setVisible] = useState<{patch:boolean; realms:boolean; chart:boolean; chat:boolean; log:boolean; debug:boolean; donate: boolean}>(() => {
  try {
    return JSON.parse(localStorage.getItem("ui:visible") || "") || {
      patch: true, realms: true, donate: true, chat: true, debug: true, log: true, chart: true
    };
  } catch {
    return { patch: true, realms: true, donate: true, chat: true, debug: true, log: true, chart: true };
  }
});

useEffect(() => {
  localStorage.setItem("ui:visible", JSON.stringify(visible));
}, [visible]);


  useEffect(() => {
    // Один раз на всю сессию!
    const unlock = () => {
      soundStore.setUserInteracted(true);
      soundStore.preloadAllSounds(); // реальная предзагрузка
      window.removeEventListener("pointerdown", unlock);
    };

    window.addEventListener("pointerdown", unlock);

    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const fetchPatch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/patch`);
        setPatchInfo(res.data);

        // Проверяем обновление версии
        if (res.data.version) {
          const lastVersion = localStorage.getItem("lastPatchVersion");
          if (lastVersion && lastVersion !== res.data.version) {
            setShowPatchBanner(true); // показать уведомление/баннер
            //if (soundStore?.play)
            if (soundStore.soundSettings.patch.enabled) {
              soundStore.play("patch");
            } else {
              console.log("Patch sound is disabled, not playing");
            }
          }
          // Обновляем localStorage, чтобы не повторять
          localStorage.setItem("lastPatchVersion", res.data.version);
        }
      } catch (err) {
        setPatchInfo({ version: null, checked_at: null, changed_at: null });
      }
    };

    fetchPatch();
    const interval = setInterval(fetchPatch, 60000);
    return () => clearInterval(interval);
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
    <>
     <div className="min-h-screen flex flex-col pl-4 pr-4 pb-0 font-mono max-w-screen-lg mx-auto">
     <div
            className={`p-2 rounded text-sm ${
              isAuthUp
                ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                : "bg-red-900 text-white animate-pulse"
            }`}
          >
            {language === "ru" ? (
              <>
                {isAuthUp ? t.authUp : t.authDown} {t.notifications}:{" "}
                {soundStore.soundSettings.realmUp.enabled &&
                !soundStore.userInteracted
                  ? "ВКЛ 🔔"
                  : "ВЫКЛ 🔕"}
                <div>
                  {!soundStore.userInteracted && (
                    <div className="bg-yellow-600/60 text-white px-3 py-2 rounded mb-3 text-sm shadow animate-pulse">
                      👆 Для активации звуковых уведомлений кликните по странице
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {isAuthUp ? t.authUp : t.authDown} {t.notifications}:{" "}
                {soundStore.soundSettings.realmUp.enabled &&
                soundStore.userInteracted
                  ? "ON 🔔"
                  : "OFF 🔕"}
                <div>
                  {!soundStore.userInteracted && (
                    <div className="bg-yellow-600/60 text-white px-3 py-2 rounded mb-3 text-sm shadow animate-pulse">
                      👆 To activate sound notifications, click on the page
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        <Helmet>
          <title>Project Epoch | status tracker, chat, patches, guides</title>
          <meta
            name="description"
            content="Track the online status of Project Epoch WoW servers. Get notifications, join the chat, and play the idle game!"
          />
          <meta
            property="og:title"
            content="Project Epoch | status tracker & chat"
          />
          <meta
            property="og:description"
            content="Project Epoch — real-time server status, patch updates, player chat, and instant notifications!"
          />
          <meta
            property="og:image"
            content="https://project-epoch.ru/vite.svg"
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://project-epoch.ru/" />
        </Helmet>

        <header className="bg-black/50 flex flex-wrap sm:flex-nowrap justify-between items-center rounded-b-2xl border-b border-cyan-800/30 shadow px-2 py-2 max-w-screen-lg mx-auto mb-4">
          <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <LanguageSwitcher language={language} setLanguage={setLanguage} />
            <BackgroundPicker />
          </div>
          <SoundSettings />
        </header>
        <main className="flex-1 flex flex-col">
          

          <h1 className="text-1xl font-bold mb-4">{t.title}</h1>

          {showTelegram && <TelegramBlock t={t} language={language} />}

          <div className="my-2 flex gap-2 flex-wrap z-50">
            <button
              onClick={() => setShowTelegram((prev) => !prev)}
              className="text-sm bg-emerald-700 hover:bg-emerald-600 active:bg-green-800 text-white shadow-md hover:bg-blue-800 text-white px-3 py-1 rounded"
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
              className="text-sm bg-pink-700 hover:bg-pink-600 active:bg-red-900 text-white shadow-md text-white px-3 py-1 rounded"
            >
              {showGame
                ? `${t.hideGame} — 🐉 ${miniGameStats.level} | 💰 ${miniGameStats.gold} | ⚔️ ${miniGameStats.dps}`
                : `${t.game} — 🐉 ${miniGameStats.level} | 💰 ${miniGameStats.gold} | ⚔️ ${miniGameStats.dps}`}
            </button>
            <VisibilityToggles value={visible} onChange={setVisible} />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3">
            {visible.patch && (
              <PatchVersion
              version={patchInfo.version}
              checked_at={patchInfo.checked_at}
              changed_at={patchInfo.changed_at}
              language={language}
            />
            )}
            {visible.realms && <RealmStatusList />}
            {visible.donate && <DonateCard />}
            
          </div>

          {showPatchBanner && patchInfo.version && (
            <PatchModal
              version={patchInfo.version}
              onClose={() => setShowPatchBanner(false)}
              language={language}
            />
          )}
{visible.chat && <RealmChat
            realm="Gurubashi PVP"
            username={username}
            onUsernameSubmit={handleUsernameSubmit}
            onChatMessage={() => {
              if (soundStore.soundSettings.chat.enabled) {
                soundStore.play("chat");
              }
            }}
          />}
          

          <section className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
             {visible.chart && <StatusChart chartData={chartData} />} 
            </div>
            <div className="flex-1 min-w-[240px]">
             {visible.log && <StatusList statuses={statuses} />} 
            </div>
          </section>

          {visible.debug && <DebugPanel />}

          <Footer t={t} />
        </main>

        <SpeedInsights />

        <Analytics />
      </div>
    </>
  );
});

export default App;
