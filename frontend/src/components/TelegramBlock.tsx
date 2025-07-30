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
    <div className="mb-4 p-4 border border-gray-700 rounded bg-gray-900 text-sm leading-relaxed">
      📬 <strong>{t.telegramHeader}</strong>
      <br />
      {t.telegramBody.split("@epoch_monitoring_bot")[0]}
      <a
        href="https://t.me/epoch_monitoring_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-400 underline"
      >
        @epoch_monitoring_bot
      </a>
      {t.telegramBody.split("@epoch_monitoring_bot")[1]}
      <br />
      <br />
      {language === "ru" ? (
        <>
          🔔 Уведомления приходят{" "}
          <span className="text-green-300">мгновенно</span>. Подключение —{" "}
          <span className="underline">в 1 клик</span>.
        </>
      ) : (
        <>
          🔔 Notifications arrive{" "}
          <span className="text-green-300">instantly</span>. One-click
          connection.
        </>
      )}
    </div>
  );
};

export default TelegramBlock;