import React from "react";
import { translations } from "../locales";
import { Tooltip } from "react-tooltip";

interface PatchVersionProps {
  version: string | null;
  checked_at: string | null;
  changed_at: string | null;
  language: "ru" | "en";
}

const PatchVersion: React.FC<PatchVersionProps> = ({
  version,
  checked_at,
  changed_at,
  language,
}) => {
  const t = translations[language];
  const formatDateLocal = (str: string | null) => {
    if (!str) return "-";
    return new Date(str).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  if (!version) {
    return (
      <div className="p-3 bg-black/80 backdrop-blur-md rounded-2xl text-white text-sm shadow-lg mb-2">
        {t.patchUnknown || "Нет данных о патче"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-4 bg-black/60 backdrop-blur-md border border-cyan-900/40 rounded-2xl shadow-xl max-w-md">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🆕</span>
        <span className="text-gray-200 font-semibold">{t.patchCurrent || "Patch version"}:</span>
        <span className="font-mono text-emerald-400 text-lg px-2 select-all tracking-wide drop-shadow">
          {version}
        </span>
        {/* Иконка ℹ️ с подсветкой при ховере */}
        <span
          className="ml-1 cursor-pointer text-cyan-300 transition drop-shadow hover:brightness-150 hover:text-cyan-200"
          data-tooltip-id="patch-tooltip"
          data-tooltip-place="left"
        >
          <span className="inline-block animate-pulse">ℹ️</span>
        </span>
        <Tooltip
          id="patch-tooltip"
          className="z-50 max-w-xs px-3 py-2 text-xs rounded-xl shadow-lg bg-gray-900/95 text-gray-100 border border-cyan-800/40"
        >
          {language === "ru" ? (
            <>
              <b>“Стандартная” версия</b> — версия оригинального клиента WoW.<br />
              <b>“Патчевая/эмуляторная” версия</b> — версия кастомных обновлений сервера. Они могут отличаться — это нормально.
            </>
          ) : (
            <>
              <b>Standard version</b> is the original WoW client version.<br />
              <b>Patch/emulator version</b> is used for server-side updates and custom content. These may differ — this is normal.
            </>
          )}
        </Tooltip>
      </div>
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <span className="text-base">📅</span>
        <span>{t.patchUploaded || "Checked at"}:</span>
        <span className="font-mono">{formatDateLocal(checked_at)}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <span className="text-base">🔄</span>
        <span>{t.patchDetected || "Detected by monitor"}:</span>
        <span className="font-mono">{formatDateLocal(changed_at)}</span>
      </div>
    </div>
  );
};

export default PatchVersion;
