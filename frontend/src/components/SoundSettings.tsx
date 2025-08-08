import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { soundStore } from "../stores/soundStore";
import { createPortal } from "react-dom";
import { uiStore } from "../stores/uiStore";

const SoundSettings: React.FC = observer(() => {
  const { soundSettings } = soundStore;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleSettings2 = () => {
    setOpen((prev) => {
      if (!prev && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPopoverPos({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX - 277, // если попап шириной 320 и нужно сместить влево, поправь!
        });
      }
      return !prev;
    });
  };

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
    logon: "Logon",
    chat: "Chat",
    patch: "Patch",
  };

  const eventIcons: Record<keyof typeof soundSettings, string> = {
    realmUp: "🟢",
    realmDown: "🔴",
    logon: "🔐",
    chat: "💬",
    patch: "💾",
  };

  return (
    <div className="flex flex-wrap gap-1 text-white px-2 py-2 border-gray-700 place-content-evenly">
      {/* Кнопки-индикаторы */}
      <div className="flex flex-wrap gap-1 max-w-full sm:max-w-none justify-self-end">
        {/* {(Object.keys(soundSettings) as (keyof typeof soundSettings)[]).map(
          (key) => {
            const event = soundSettings[key];
            const blocked = !uiStore.isEventAllowed(key);
            return (
              <button
                key={key}
                onClick={() =>
                  soundStore.updateEvent(key, {
                    enabled: !soundSettings[key].enabled,
                  })
                }
                className={`flex items-center text-xs px-2 py-1 rounded-lg select-none shadow transition-all
                  ${
                    event.enabled
                      ? "bg-emerald-700/90 text-white  hover:bg-emerald-600"
                      : "bg-black/60 text-gray-400 border border-gray-600 hover:bg-gray-800"
                  }
                  ${blocked ? "opacity-60 ring-1 ring-amber-400/40" : ""}
                `}
                title={
                  blocked
                    ? `${eventLabels[key]} muted: widjet hidden`
                    : eventLabels[key]
                }
              >
                <span className="mr-1 text-base">{eventIcons[key]}</span>
                {eventLabels[key]}
              </button>
            );
          }
        )} */}

        {/* Кнопка настроек */}
        <div className="relative ml-2 sm:ml-4">
          <button
            ref={buttonRef}
            onClick={() => {
              toggleSettings2();
            }}
            className="text-2xl focus:outline-none transition hover:rotate-12 hover:text-cyan-300"
            aria-label="Open sound settings"
          >
            ⚙️
          </button>
          {/* Панель настроек */}
          {open &&
            createPortal(
              <div
                ref={panelRef}
                style={{
                  position: "absolute",
                  top: popoverPos.top,
                  left: popoverPos.left,
                  zIndex: 9999,
                  width: 320,
                }}
                className="
                absolute  mt-2 w-80 max-w-[calc(100vw-1rem)]
                bg-black/90 backdrop-blur-lg border border-cyan-800/40
                text-sm p-4 rounded-2xl shadow-2xl  overflow-y-auto max-h-[85vh]
                animate-fadeIn
              "
              >
                <div className="mb-3 text-cyan-200 font-semibold text-base flex items-center gap-2">
                  <span>🔊</span> Sound settings
                </div>
                {/* Предупреждение о блокировках */}
                {(() => {
                  const msgs: string[] = [];
                  if (!uiStore.visibility.realms)
                    msgs.push("Realms sounds are muted (widget hidden)");
                  if (!uiStore.visibility.patch)
                    msgs.push("Patch sounds are muted (widget hidden)");
                  if (!uiStore.visibility.logon)
                    msgs.push("Logon sounds are muted (widget hidden)");
                  if (!uiStore.visibility.chat)
                    msgs.push("Chat sounds are muted (widget hidden)");
                  return msgs.length ? (
                    <div className="mb-3 text-xs text-amber-300 bg-amber-900/30 border border-amber-700/40 rounded p-2">
                      ⚠️ {msgs.join(" • ")}
                    </div>
                  ) : null;
                })()}
                {(
                  Object.keys(soundSettings) as (keyof typeof soundSettings)[]
                ).map((key) => {
                  const event = soundSettings[key];
                  const blocked = !uiStore.isEventAllowed(key);
                  return (
                    <div
                      key={key}
                      className="mb-4 p-3  border border-cyan-800/30 bg-black/60 rounded-xl shadow-sm"
                    >
                      {/* Заголовок события с переключателем */}
                      <button
                        onClick={() =>
                          soundStore.updateEvent(key, {
                            enabled: !soundSettings[key].enabled,
                          })
                        }
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-sm font-semibold transition-all
                        ${
                          event.enabled
                            ? "bg-emerald-700 hover:bg-emerald-600 text-emerald-100 hover:bg-emerald-700"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-900"
                        }
                        ${blocked ? "opacity-60 ring-1 ring-amber-400/40" : ""}
                      `}
                      >
                        <span>
                          {eventIcons[key]} {eventLabels[key]}
                        </span>
                        <span>{event.enabled ? "ON" : "OFF"}</span>
                      </button>
                      {blocked && (
                        <div className="mt-2 text-xs text-amber-300">
                          Muted: related widjet is hidden
                        </div>
                      )}

                      {/* Детали, показываем только если включено */}
                      {event.enabled && (
                        <div className="mt-3 space-y-3">
                          {/* Громкость */}
                          <label className="block text-xs text-gray-300">
                            Volume{" "}
                            <span className="font-mono">
                              ({Math.round(event.volume * 100)}%)
                            </span>
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
                              className="w-full accent-emerald-400"
                            />
                          </label>
                          {/* Тип звука */}
                          <label className="block text-xs text-gray-300">
                            Sound Type
                            <select
                              value={event.soundType}
                              onChange={(e) =>
                                soundStore.updateEvent(key, {
                                  soundType: e.target.value,
                                })
                              }
                              className="w-full bg-black/90 text-white border border-cyan-700 px-2 py-1 mt-1 text-xs rounded"
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
                            className="text-cyan-400 text-xs hover:text-emerald-400 transition-colors"
                          >
                            🔊 Test Sound
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Глобальная остановка */}
                <div className="border-t border-cyan-700 pt-3 mt-4">
                  <button
                    onClick={() => soundStore.stop()}
                    className="text-red-400 text-xs hover:text-red-300"
                  >
                    ⏹️ Stop All Sounds
                  </button>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
});

export default SoundSettings;
