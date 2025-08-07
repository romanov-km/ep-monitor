import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { soundStore } from "../stores/soundStore";

const SoundSettings: React.FC = observer(() => {
  const { soundSettings } = soundStore;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      // @ts-ignore
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleSettings = () => setOpen((prev) => !prev);

  const soundOptions = [
    { value: "levelup", label: "Level Up" },
    { value: "BG", label: "BG" },
    { value: "70elite", label: "70 Elite" },
    { value: "murloc", label: "Murloc" },
    { value: "newmsg", label: "Chat Message" },
    { value: "down", label: "Realm Down" },
  ];

  const eventLabels: Record<keyof typeof soundSettings, string> = {
    realmUp: "Up",
    realmDown: "Down",
    authUp: "Auth",
    chat: "Chat",
    patch: "Patch",
  };

  const eventIcons: Record<keyof typeof soundSettings, string> = {
    realmUp: "🟢",
    realmDown: "🔴",
    authUp: "🔐",
    chat: "💬",
    patch: "💾",
  };

  return (
    <div className="flex flex-wrap gap-1 text-white px-2 py-2 border-b border-gray-700 place-content-evenly">
      {/* Кнопки-индикаторы без горизонтального скрола */}
      <div className="flex flex-wrap gap-1 max-w-full sm:max-w-none justify-self-end">
        {(Object.keys(soundSettings) as (keyof typeof soundSettings)[]).map(
          (key) => {
            const event = soundSettings[key];
            return (
              <button
                key={key}
                onClick={() =>
                  soundStore.updateEvent(key, {
                    enabled: !soundSettings[key].enabled,
                  })
                }
                className={`flex items-center text-xs px-2 py-1 rounded select-none transition-colors
                ${
                  event.enabled
                    ? "bg-green-800 hover:bg-green-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                title={eventLabels[key]}
              >
                {eventIcons[key]} {eventLabels[key]}
              </button>
            );
          }
        )}
        
        {/* Кнопка настроек */}
        <div className="relative ml-2 sm:ml-4" ref={panelRef}>
          <button onClick={toggleSettings} className="text-xl focus:outline-none">
          ⚙️
        </button>
          {/* Панель настроек */}
          {open && (
            <div
              
              className="absolute right-0 top-full mt-1 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-black/85 border border-gray-600 text-sm p-4 rounded shadow-lg z-50 overflow-y-auto max-h-[80vh]"
            >
              {(
                Object.keys(soundSettings) as (keyof typeof soundSettings)[]
              ).map((key) => {
                const event = soundSettings[key];
                return (
                  <div
                    key={key}
                    className="mb-4 p-3 border border-gray-700 rounded"
                  >
                    {/* Заголовок события с переключателем */}
                    <button
                      onClick={() =>
                        soundStore.updateEvent(key, {
                          enabled: !soundSettings[key].enabled,
                        })
                      }
                      className={`w-full flex items-center px-2 py-1 rounded text-sm font-semibold transition-colors
                      ${
                        event.enabled
                          ? "bg-green-800 hover:bg-green-500"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <span>{eventLabels[key]}</span>
                      <span>{event.enabled ? "ON" : "OFF"}</span>
                    </button>

                    {/* Детали, показываем только если включено */}
                    {event.enabled && (
                      <div className="mt-3 space-y-3">
                        {/* Громкость */}
                        <label className="block text-xs">
                          Volume ({Math.round(event.volume * 100)}%)
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={event.volume}
                            onChange={(e) =>
                              soundStore.updateEvent(key, {
                                volume: Number(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                        </label>

                        {/* Тип звука */}
                        <label className="block text-xs">
                          Sound Type
                          <select
                            value={event.soundType}
                            onChange={(e) =>
                              soundStore.updateEvent(key, {
                                soundType: e.target.value,
                              })
                            }
                            className="w-full bg-black/85 text-white border border-gray-600 px-2 py-1 mt-1 text-xs"
                          >
                            {soundOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Тест */}
                        <button
                          onClick={() => soundStore.playTestSound(key)}
                          className="text-blue-400 text-xs hover:text-blue-300"
                        >
                          🔊 Test Sound
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Глобальная остановка */}
              <div className="border-t border-gray-700 pt-2">
                <button
                  onClick={() => soundStore.stop()}
                  className="text-red-400 text-xs hover:text-red-300"
                >
                  ⏹️ Stop All Sounds
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SoundSettings;
