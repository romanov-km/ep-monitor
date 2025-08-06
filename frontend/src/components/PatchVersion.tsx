import React from "react";
import { translations } from "../locales";

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

  if (!version) {
    return (
      <div className="mb-4 p-2 bg-slate-700 rounded text-white text-sm">
        {t.patchUnknown || "Нет данных о патче"}
      </div>
    );
  }

  return (
    <div className="mb-4 p-2 bg-slate-700 rounded text-white text-sm">
      <div>
        <b>🆕 {t.patchCurrent || "Patch version"}:</b>{" "}
        <span className="font-mono">{version}</span>
      </div>
      <div>
        <b>📅 {t.patchUploaded || "Uploaded"}:</b> <span>{checked_at}</span>
      </div>
      <div>
        <b>🔄 {t.patchDetected || "Detected by monitor"}:</b>{" "}
        <span>{changed_at}</span>
      </div>
    </div>
  );
};

export default PatchVersion;
