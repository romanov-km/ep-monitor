import { useEffect, useRef, useState } from "react";
import imgAlliance2 from '@/assets/bg/boobs.png';
import imgMale from '@/assets/bg/male.png';
import imgWoWJungle from '@/assets/bg/bg.png';
import imgQueue from '@/assets/bg/trol.png';
import imgBoobs from '@/assets/bg/raw.png';
import imgAlliance from '@/assets/bg/alliance.png';
import imgEpoch from '@/assets/bg/unnamed.png';

const knownFileToId: Record<string, string> = {
  'boobs.png': 'alliance2',
  'male.png': 'male',
  'bg.png': 'wowJungle',
  'trol.png': 'queue',
  'raw.png': 'boobs',
  'alliance.png': 'alliance',
  'unnamed.png': 'epoch',
};

const options = [
  { id: "alliance2", name: "Alliance2", value: `url(${imgAlliance2})`, img: imgAlliance2 },
  { id: "male", name: "Male", value: `url(${imgMale})`, img: imgMale },
  { id: "wowJungle", name: "WoW Jungle", value: `url(${imgWoWJungle})`, img: imgWoWJungle },
  { id: "queue", name: "Queue", value: `url(${imgQueue})`, img: imgQueue },
  { id: "boobs", name: "Boobs", value: `url(${imgBoobs})`, img: imgBoobs },
  { id: "alliance", name: "Alliance", value: `url(${imgAlliance})`, img: imgAlliance },
  { id: "epoch", name: "Epoch", value: `url(${imgEpoch})`, img: imgEpoch },
  {
    id: "night",
    name: "Night",
    value: "linear-gradient(135deg,#181828 60%,#0054ad 100%)",
    gradient: "linear-gradient(135deg,#181828 60%,#0054ad 100%)",
  },
];

function getInitialId(): string {
  try {
    const savedId = localStorage.getItem("siteBg:id");
    if (savedId && options.some(o => o.id === savedId)) return savedId;

    const legacy = localStorage.getItem("siteBg");
    if (legacy) {
      const exact = options.find(o => o.value === legacy);
      if (exact) return exact.id;

      const m = legacy.match(/url\(([^)]+)\)/);
      const p = (m ? m[1] : legacy).split('?')[0];
      const base = p.split('/').pop() || '';
      const mapped = knownFileToId[base];
      if (mapped) return mapped;

      if (legacy.startsWith("linear-gradient")) return "night";
    }
  } catch {}
  return options[0].id;
}

export const BackgroundPicker = () => {
  const [currentId, setCurrentId] = useState<string>(() => getInitialId());
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMobile = window.innerWidth < 700;

  const [nudge, setNudge] = useState(false);
  const NUDGE_EVERY = 5 * 60 * 1000;
  useEffect(() => {
    const kick = () => {
      setNudge(true);
      setTimeout(() => setNudge(false), 1800);
      localStorage.setItem("bg:nudgeAt", String(Date.now()));
    };
    const last = Number(localStorage.getItem("bg:nudgeAt") || "0");
    if (Date.now() - last > 60 * 60 * 1000) setTimeout(kick, 1200);
    const id = setInterval(kick, NUDGE_EVERY);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const opt = options.find(o => o.id === currentId) || options[0];
    document.body.style.setProperty("--site-bg", opt.value);
    localStorage.setItem("siteBg:id", currentId);
    localStorage.setItem("siteBg", opt.value);
  }, [currentId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      // @ts-ignore
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentOpt = options.find((o) => o.id === currentId) || options[0];

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
          <div className="w-full h-full rounded-lg" style={{ background: currentOpt.gradient }}>
            <span className="absolute bottom-1 right-1 text-white/70 pointer-events-none text-xs" style={{ filter: "drop-shadow(0 0 2px #000)" }}>
              🌙
            </span>
          </div>
        )}
      </button>

      <div
        className={`
          absolute
          ${isMobile ? "left-1/2 top-full -translate-x-1/2 mt-2 flex-row" : "left-full top-1/2 -translate-y-1/2 flex-col"}
          absolute left-full top-1/2 -translate-y-1/2 flex flex-row gap-2 z-40
          bg-black/80 rounded-lg shadow-xl border border-gray-700
          px-2 py-2
          transition-all duration-200
          ${open ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95"}
        `}
      >
        {options
          .filter((opt) => opt.id !== currentId)
          .map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setCurrentId(opt.id);
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
                <div className="w-full h-full rounded-lg" style={{ background: opt.gradient }}>
                  <span className="absolute bottom-1 right-1 text-white/70 pointer-events-none text-xs" style={{ filter: "drop-shadow(0 0 2px #000)" }}>
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
