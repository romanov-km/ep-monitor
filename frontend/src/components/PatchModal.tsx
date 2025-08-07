import React from "react";

interface PatchModalProps {
  version: string;
  onClose: () => void;
  language: "ru" | "en";
}

const PatchModal: React.FC<PatchModalProps> = ({ version, onClose, language }) => {
  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xs rounded-2xl p-6 text-center
        bg-black/70 backdrop-blur-md border border-cyan-700/40 shadow-2xl
        animate-fadeIn"
        style={{ animationDuration: "0.15s" }}
      >
        {/* Кнопка закрытия */}
        <button
          className="absolute right-3 top-2 text-2xl text-gray-400 hover:text-red-500 transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {/* Иконка */}
        <div className="text-4xl mb-3 drop-shadow-glow animate-pulse select-none">🆕</div>
        {/* Заголовок */}
        <div className="text-xl font-bold mb-2 text-cyan-300 drop-shadow">
          {language === "ru" ? "Вышла новая версия патча!" : "New Patch Released!"}
        </div>
        {/* Версия */}
        <div className="font-mono bg-cyan-900/30 text-cyan-200 rounded-lg px-3 py-2 mb-2 text-base shadow-inner tracking-widest select-all border border-cyan-500/20">
          {version}
        </div>
        {/* Описание */}
        <div className="text-xs text-gray-300 mb-3">
          {language === "ru"
            ? "Для игры требуется обновление файлов клиента."
            : "Please update your client files to continue playing."}
        </div>
        {/* Кнопка ОК */}
        <button
          className="mt-2 px-5 py-2 bg-cyan-700 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow transition-colors text-sm"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default PatchModal;
