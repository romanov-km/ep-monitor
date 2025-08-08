import { useEffect, useRef, useState } from "react";

const options = [
  { name: "Alliance2", value: "url('/boobs.png')", img: "/boobs.png" },
  { name: "WoW Jungle", value: "url('/bg.png')", img: "/bg.png" },
  { name: "Queue", value: "url('/trol.png')", img: "/trol.png" },
  { name: "Boobs", value: "url('/raw.png')", img: "/raw.png" },
  { name: "Alliance", value: "url('/alliance.png')", img: "/alliance.png" },
  { name: "Epoch", value: "url('/unnamed.png')", img: "/unnamed.png" },
  {
    name: "Night",
    value: "linear-gradient(135deg,#181828 60%,#0054ad 100%)",
    gradient: "linear-gradient(135deg,#181828 60%,#0054ad 100%)",
  },
];

export const BackgroundPicker = () => {
  const [currentBg, setCurrentBg] = useState<string>(
    localStorage.getItem("siteBg") || options[0].value
  );
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMobile = window.innerWidth < 700;

  
    const [nudge, setNudge] = useState(false);
    const NUDGE_EVERY = 5 * 60 * 1000; // 5 минут
    useEffect(() => {
      const kick = () => {
        setNudge(true);
        setTimeout(() => setNudge(false), 1800);
        localStorage.setItem("bg:nudgeAt", String(Date.now()));
      };
      const last = Number(localStorage.getItem("bg:nudgeAt") || "0");
      if (Date.now() - last > 60 * 60 * 1000) setTimeout(kick, 1200); // при заходе, если >1ч
      const id = setInterval(kick, NUDGE_EVERY);
      return () => clearInterval(id);
    }, []);

  useEffect(() => {
    document.body.style.setProperty("--site-bg", currentBg);
    localStorage.setItem("siteBg", currentBg);
  }, [currentBg]);

  // Закрываем по клику вне
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      // @ts-ignore
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Главная (текущая) опция
  const currentOpt = options.find((o) => o.value === currentBg) || options[0];

  return (
    <div className="relative" ref={panelRef}>
      <button
        className={`
          w-10 h-10 rounded-lg border-2 bg-gray-900/80 shadow flex items-center justify-center relative
          ${open ? "border-green-400 ring-2 ring-green-500" : "border-gray-700"}
          transition ${nudge ? "bg-picker-nudge ring-2 ring-emerald-400 border-emerald-400" : ""}
        `}
        title="Change background"
        onClick={() => setOpen((o) => !o)}
      >
        {currentOpt.img ? (
          <img
            src={currentOpt.img}
            alt={currentOpt.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div
            className="w-full h-full rounded-lg"
            style={{ background: currentOpt.gradient }}
          >
            <span
              className="absolute bottom-1 right-1 text-white/70 pointer-events-none text-xs"
              style={{ filter: "drop-shadow(0 0 2px #000)" }}
            >
              🌙
            </span>
          </div>
        )}
      </button>

      {/* Выезжающая панель выбора (кроме текущего) */}
      <div
        className={`
    absolute
    ${
      isMobile
        ? "left-1/2 top-full -translate-x-1/2 mt-2 flex-row"
        : "left-full top-1/2 -translate-y-1/2 flex-col"
    }
    absolute left-full top-1/2 -translate-y-1/2 flex flex-row gap-2 z-40
    bg-black/80 rounded-lg shadow-xl border border-gray-700
    px-2 py-2
    transition-all duration-200
    ${
      open
        ? "opacity-100 pointer-events-auto scale-100"
        : "opacity-0 pointer-events-none scale-95"
    }
  `}
      >
        {options
          .filter((opt) => opt.value !== currentBg)
          .map((opt) => (
            <button
              key={opt.name}
              onClick={() => {
                setCurrentBg(opt.value);
                setOpen(false);
                setNudge(false);
              }}
              className="w-9 h-9 rounded-lg border border-gray-600 hover:border-green-400 p-0.5 bg-gray-800/80 flex items-center justify-center transition"
              title={opt.name}
            >
              {opt.img ? (
                <img
                  src={opt.img}
                  alt={opt.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div
                  className="w-full h-full rounded-lg"
                  style={{ background: opt.gradient }}
                >
                  <span
                    className="absolute bottom-1 right-1 text-white/70 pointer-events-none text-xs"
                    style={{ filter: "drop-shadow(0 0 2px #000)" }}
                  >
                    🌙
                  </span>
                </div>
              )}
            </button>
          ))}
      </div>
    </div>
  );
};
