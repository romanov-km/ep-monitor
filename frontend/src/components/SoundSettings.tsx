import React from "react";

interface SoundSettingsProps {
  alertEnabled: boolean;
  setAlertEnabled: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
  soundType: string;
  setSoundType: (value: string) => void;
  playTestSound: () => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({
  alertEnabled,
  setAlertEnabled,
  volume,
  setVolume,
  soundType,
  setSoundType,
  playTestSound,
}) => {
  return (
    <div className="flex justify-between items-center bg-black text-white px-4 py-2 border-b border-gray-700">
      <h2 className="text-lg font-semibold">Project Epoch Realm Status</h2>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <span className="text-sm">Alert</span>
          <input
            type="checkbox"
            checked={alertEnabled}
            onChange={() => setAlertEnabled(!alertEnabled)}
            className="form-checkbox h-4 w-4"
          />
        </label>

        <div className="relative group">
          <button className="text-xl">⚙️</button>
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-600 text-sm p-4 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <label className="block mb-2">
              Sound Volume ({Math.round(volume * 100)}%)
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </label>

            <label className="block mb-2">
              Sound Type
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 px-2 py-1 mt-1"
              >
                <option value="levelup">Level Up</option>
                <option value="BG">BG</option>
                <option value="70elite">70 Elite</option>
                <option value="murloc">Murloc</option>
              </select>
            </label>

            <button
              onClick={playTestSound}
              className="text-blue-400 underline text-sm mt-1"
            >
              TEST SOUND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundSettings;