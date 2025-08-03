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

  const updateEvent = (eventType: keyof SoundSettings, updates: Partial<SoundEvent>) => {
    setSoundSettings({
      ...soundSettings,
      [eventType]: {
        ...soundSettings[eventType],
        ...updates,
      },
    });
  };

  const soundOptions = [
    { value: "levelup", label: "Level Up" },
    { value: "BG", label: "BG" },
    { value: "70elite", label: "70 Elite" },
    { value: "murloc", label: "Murloc" },
    { value: "newmsg", label: "Chat Message" },
  ];

  const eventLabels = {
    realmUp: "Realm Up",
    authUp: "Auth Server Up", 
    chat: "Chat Message",
  };

  return (
    <div className="flex justify-between items-center bg-black text-white px-4 py-2 border-b border-gray-700 relative">
      <h2 className="text-lg font-semibold">Project Epoch Realm Status</h2>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {Object.entries(soundSettings).map(([key, event]) => (
            <label key={key} className="flex items-center space-x-1 cursor-pointer text-xs">
              <span>{eventLabels[key as keyof SoundSettings]}</span>
              <input
                type="checkbox"
                checked={event.enabled}
                onChange={() => updateEvent(key as keyof SoundSettings, { enabled: !event.enabled })}
                className="form-checkbox h-3 w-3"
              />
            </label>
          ))}
        </div>

        <div className="relative">
          <button onClick={toggleSettings} className="text-xl">
            ⚙️
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-600 text-sm p-4 rounded shadow-lg z-50">
              {Object.entries(soundSettings).map(([key, event]) => (
                <div key={key} className="mb-4 p-3 border border-gray-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-white">
                      {eventLabels[key as keyof SoundSettings]}
                    </label>
                    <input
                      type="checkbox"
                      checked={event.enabled}
                      onChange={() => updateEvent(key as keyof SoundSettings, { enabled: !event.enabled })}
                      className="form-checkbox h-4 w-4"
                    />
                  </div>
                  
                  {event.enabled && (
                    <>
                      <label className="block mb-2 text-xs">
                        Volume ({Math.round(event.volume * 100)}%)
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={event.volume}
                          onChange={(e) => updateEvent(key as keyof SoundSettings, { volume: Number(e.target.value) })}
                          className="w-full"
                        />
                      </label>

                      <label className="block mb-2 text-xs">
                        Sound Type
                        <select
                          value={event.soundType}
                          onChange={(e) => updateEvent(key as keyof SoundSettings, { soundType: e.target.value })}
                          className="w-full bg-gray-800 text-white border border-gray-600 px-2 py-1 mt-1 text-xs"
                        >
                          {soundOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        onClick={() => playTestSound(key as keyof SoundSettings)}
                        className="text-blue-400 text-xs mt-1 hover:text-blue-300"
                      >
                        🔊 Test Sound
                      </button>
                    </>
                  )}
                </div>
              ))}

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
    </div>
  );
};

export default SoundSettings;