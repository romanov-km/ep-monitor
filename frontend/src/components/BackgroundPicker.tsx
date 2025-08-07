import { useEffect, useState } from "react";

const options = [
  { name: "WoW Jungle", value: "url('/bg.png')", img: "/bg.png" },
  { name: "Queue", value: "url('/trol.png')", img: "/trol.png" },
  { name: "Boobs", value: "url('/raw.png')", img: "/raw.png" },
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

  useEffect(() => {
    document.body.style.setProperty("--site-bg", currentBg);
    localStorage.setItem("siteBg", currentBg);
  }, [currentBg]);

  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt.name}
          onClick={() => setCurrentBg(opt.value)}
          className={`
        w-10 h-10 rounded-lg mx-1 p-0.5 border-2 transition
        ${
          currentBg === opt.value
            ? "border-green-400 ring-2 ring-green-500"
            : "border-gray-700"
        }
        bg-gray-900/80 shadow relative flex items-center justify-center
      `}
          title={opt.name}
        >
          {opt.img ? (
            // Если это картинка — показываем её
            <img
              src={opt.img}
              alt={opt.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            // Если это градиент — делаем div c этим градиентом
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
  );
};
