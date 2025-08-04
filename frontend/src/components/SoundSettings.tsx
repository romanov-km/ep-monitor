import React, { useState } from "react";

interface SoundEvent {
  enabled: boolean;
  soundType: string;
  volume: number;
}

interface SoundSettings {
  realmUp: SoundEvent;
  authUp: SoundEvent;
  chat: SoundEvent;
  realmDown: SoundEvent;
}

interface SoundSettingsProps {
  soundSettings: SoundSettings;
  setSoundSettings: (settings: SoundSettings) => void;
  playTestSound: (eventType: keyof SoundSettings) => void;
  stopSound: () => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({
  soundSettings,
  setSoundSettings,
  playTestSound,
  stopSound,
}) => {
  const [open, setOpen] = useState(false);

  const toggleSettings = () => setOpen((prev) => !prev);

  /**
   * Обновляет выбранное событие, гарантируя иммутабельность
   */
  const updateEvent = (
    eventType: keyof SoundSettings,
    updates: Partial<SoundEvent>
  ) => {
    setSoundSettings({
      ...soundSettings,
      [eventType]: {
        ...soundSettings[eventType],
        ...updates,
      },
    });
  };

  /**
   * Список звуков — здесь легко добавить новые.
   */
  const soundOptions = [
    { value: "levelup", label: "Level Up" },
    { value: "BG", label: "BG" },
    { value: "70elite", label: "70 Elite" },
    { value: "murloc", label: "Murloc" },
    { value: "newmsg", label: "Chat Message" },
    { value: "down", label: "Realm Down" },
  ];

  const eventLabels: Record<keyof SoundSettings, string> = {
    realmUp: "Up",
    realmDown: "Down",
    authUp: "Auth",
    chat: "Chat",
  };

  const eventIcons: Record<keyof SoundSettings, string> = {
    realmUp: "🟢",
    realmDown: "🔴",
    authUp: "🔐",
    chat: "💬",
  };

  return (
    <div className="flex flex-wrap items-center justify-between bg-black text-white px-4 py-2 border-b border-gray-700">
      {/* Заголовок */}
      <h2 className="text-lg font-semibold mr-2 truncate max-w-[150px] sm:max-w-none">
        Project Epoch Realm Status
      </h2>

      {/* Кнопки-индикаторы без горизонтального скрола */}
      <div className="flex flex-wrap gap-1 max-w-full sm:max-w-none">
        {(Object.keys(soundSettings) as (keyof SoundSettings)[]).map((key) => {
          const event = soundSettings[key];
          return (
            <button
              key={key}
              onClick={() =>
                updateEvent(key, {
                  enabled: !soundSettings[key].enabled,
                })
              }
              className={`flex items-center text-xs px-2 py-1 rounded select-none transition-colors
                ${event.enabled ? "bg-green-600 hover:bg-green-500" : "bg-gray-800 hover:bg-gray-700"}`}
              title={eventLabels[key]}
            >
              {eventIcons[key]} {eventLabels[key]}
            </button>
          );
        })}
      </div>

      {/* Кнопка настроек */}
      <div className="relative ml-2 sm:ml-4">
        <button onClick={toggleSettings} className="text-xl focus:outline-none">
          ⚙️
        </button>

        {/* Панель настроек */}
        {open && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-gray-900 border border-gray-600 text-sm p-4 rounded shadow-lg z-50 overflow-y-auto max-h-[80vh]">
            {(Object.keys(soundSettings) as (keyof SoundSettings)[]).map((key) => {
              const event = soundSettings[key];
              return (
                <div key={key} className="mb-4 p-3 border border-gray-700 rounded">
                  {/* Заголовок события с переключателем */}
                  <button
                    onClick={() =>
                      updateEvent(key, {
                        enabled: !soundSettings[key].enabled,
                      })
                    }
                    className={`w-full flex justify-between items-center px-2 py-1 rounded text-sm font-semibold transition-colors
                      ${event.enabled ? "bg-green-600 hover:bg-green-500" : "bg-gray-800 hover:bg-gray-700"}`}
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
                            updateEvent(key, {
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
                            updateEvent(key, {
                              soundType: e.target.value,
                            })
                          }
                          className="w-full bg-gray-800 text-white border border-gray-600 px-2 py-1 mt-1 text-xs"
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
                        onClick={() => playTestSound(key)}
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
                onClick={stopSound}
                className="text-red-400 text-xs hover:text-red-300"
              >
                ⏹️ Stop All Sounds
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundSettings;
