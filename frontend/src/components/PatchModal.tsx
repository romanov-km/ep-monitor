import React from "react";

interface PatchModalProps {
  version: string;
  onClose: () => void;
  language: "ru" | "en";
}

const PatchModal: React.FC<PatchModalProps> = ({ version, onClose, language }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-xs relative text-center">
        <button
          className="absolute right-3 top-2 text-2xl text-gray-500 hover:text-red-500"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="text-3xl mb-3">🆕</div>
        <div className="text-lg font-bold mb-2">
          {language === "ru" ? "Вышла новая версия патча!" : "New Patch Released!"}
        </div>
        <div className="font-mono bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 mb-2 text-sm">
          {version}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {language === "ru"
            ? "Для игры требуется обновление файлов клиента."
            : "Please update your client files to continue playing."}
        </div>
        <button
          className="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default PatchModal;
