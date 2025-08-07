import React from "react";

interface LanguageSwitcherProps {
  language: "ru" | "en";
  setLanguage: (lang: "ru" | "en") => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  setLanguage,
}) => {
  return (
    <div className="inline-flex  px-1 py-1 shadow">
      <button
        onClick={() => setLanguage("ru")}
        className={`px-3 py-1 rounded-full backdrop-blur font-semibold text-xs transition-colors
          ${language === "ru"
            ? "bg-emerald-700 hover:bg-emerald-600 text-white shadow-md"
            : "text-gray-300 hover:bg-white/10"}
        `}
        aria-pressed={language === "ru"}
      >
        🇷🇺 Русский
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`ml-1 px-3 py-1 rounded-full backdrop-blur font-semibold text-xs transition-colors
          ${language === "en"
            ? "bg-emerald-700 hover:bg-emerald-600 text-white shadow-md"
            : "text-gray-300 hover:bg-white/10"}
        `}
        aria-pressed={language === "en"}
      >
        🇬🇧 English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
