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
  // locale и timeZone не указываем — будет именно локально для пользователя!
  return new Date(str).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    // timeZone: не указываем!
  });
};


  if (!version) {
    return (
      <div className="p-2 bg-black/85 rounded text-white text-sm">
        {t.patchUnknown || "Нет данных о патче"}
      </div>
    );
  }

  return (
    <div className="p-2 bg-black/40 rounded text-white text-sm">
      <div>
        <b>🆕 {t.patchCurrent || "Patch version"}:</b>{" "}
        <span className="font-mono">{version}</span>
        {/* Иконка ℹ️ с tooltip */}
        <span
          className="ml-2 cursor-pointer"
          data-tooltip-id="patch-tooltip"
          data-tooltip-place="right"
        >
          ℹ️
        </span>
        <Tooltip id="patch-tooltip" className="z-50 max-w-xs px-3 py-2 text-xs rounded shadow-lg bg-gray-900 text-white">
          {language === "ru"
            ? (
              <>
                <b>“Стандартная” версия</b> — версия оригинального клиента WoW.<br />
                <b>“Патчевая/эмуляторная” версия</b> — версия кастомных обновлений сервера. Они могут отличаться — это нормально.
              </>
            )
            : (
              <>
                <b>Standard version</b> is the original WoW client version.<br />
                <b>Patch/emulator version</b> is used for server-side updates and custom content. These may differ — this is normal.
              </>
            )}
        </Tooltip>
      </div>
      <div>
        <b>📅 {t.patchUploaded || "Checked at"}:</b> <span>{formatDateLocal(checked_at)}</span>
      </div>
      <div>
        <b>🔄 {t.patchDetected || "Detected by monitor"}:</b> <span>{formatDateLocal(changed_at)}</span>
      </div>
    </div>
  );
};

export default PatchVersion;
