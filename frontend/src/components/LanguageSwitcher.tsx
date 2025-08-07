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
    <div className="">
      <button
        onClick={() => setLanguage("ru")}
        className={`mr-2 px-2 py-1 border ${
          language === "ru" ? "bg-green-800 text-white" : "border-gray-600"
        }`}
      >
        🇷🇺 Русский
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 border ${
          language === "en" ? "bg-green-800 text-white" : "border-gray-600"
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
};

export default LanguageSwitcher;