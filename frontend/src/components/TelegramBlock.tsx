import React from "react";

interface TelegramBlockProps {
  t: {
    telegramHeader: string;
    telegramBody: string;
  };
  language: "ru" | "en";
}

const TelegramBlock: React.FC<TelegramBlockProps> = ({ t, language }) => {
  return (
    <div className="
      mb-5 p-4
      bg-gradient-to-br from-cyan-950/80 via-black/70 to-cyan-900/60
      border border-cyan-700/50
      rounded-2xl shadow-lg
      text-sm leading-relaxed
      text-gray-100
      flex flex-col gap-2
      animate-fadeIn
      relative
      backdrop-blur-md
    ">
      <div className="flex items-center gap-2 mb-1">
        {/* Можно вставить SVG иконку Telegram для большего вау */}
        <span className="text-2xl text-cyan-400 drop-shadow animate-pulse select-none">✈️</span>
        <strong className="text-cyan-200 text-base">{t.telegramHeader}</strong>
      </div>
      <div>
        {t.telegramBody.split("@epoch_monitoring_bot")[0]}
        <a
          href="https://t.me/epoch_monitoring_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-semibold transition select-all text-base"
        >
          @epoch_monitoring_bot
        </a>
        {t.telegramBody.split("@epoch_monitoring_bot")[1]}
      </div>
      <div className="mt-2 text-xs text-cyan-100">
        {language === "ru" ? (
          <>
            🔔 Уведомления приходят{" "}
            <span className="text-emerald-300 font-bold animate-pulse">мгновенно</span>. Подключение —{" "}
            <span className="underline underline-offset-2 font-medium">в 1 клик</span>.
          </>
        ) : (
          <>
            🔔 Notifications arrive{" "}
            <span className="text-emerald-300 font-bold animate-pulse">instantly</span>. One-click connection.
          </>
        )}
      </div>
    </div>
  );
};

export default TelegramBlock;
