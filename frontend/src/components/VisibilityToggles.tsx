import React from "react";

type Visible = { patch: boolean; realms: boolean; donate: boolean; chat: boolean; debug: boolean; log: boolean; chart: boolean };

export const VisibilityToggles: React.FC<{
  value: Visible;
  onChange: (v: Visible) => void;
}> = ({ value, onChange }) => {
  const allOn = value.patch && value.realms && value.donate && value.chat;

  const pill = (active: boolean) =>
    `text-xs px-3 py-1 rounded-xl border transition select-none ${
      active
        ? "bg-emerald-700 text-white border-emerald-500"
        : "bg-black/40 text-gray-300 border-gray-600 hover:border-emerald-400"
    }`;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        className={pill(allOn)}
        onClick={() =>
          onChange({
            patch: !allOn,
            realms: !allOn,
            donate: !allOn,
            chat: !allOn,
            chart: !allOn,
            log: !allOn,
            debug: !allOn
          })
        }
        title={allOn ? "Hide all" : "Show all"}
      >
        {allOn ? "Hide all" : "Show all"}
      </button>

      <button
        className={pill(value.patch)}
        onClick={() => onChange({ ...value, patch: !value.patch })}
        title="Toggle Patch"
      >
        Patch
      </button>
      <button
        className={pill(value.realms)}
        onClick={() => onChange({ ...value, realms: !value.realms })}
        title="Toggle Realms"
      >
        Realms
      </button>
      <button
        className={pill(value.donate)}
        onClick={() => onChange({ ...value, donate: !value.donate })}
        title="Toggle Donate"
      >
        Donate
      </button>
      <button
        className={pill(value.chat)}
        onClick={() => onChange({ ...value, chat: !value.chat })}
        title="Toggle Chat"
      >
        Chat
      </button>
      <button
        className={pill(value.chart)}
        onClick={() => onChange({ ...value, chart: !value.chart })}
        title="Toggle Chart"
      >
        Chart
      </button>
      <button
        className={pill(value.debug)}
        onClick={() => onChange({ ...value, debug: !value.debug })}
        title="Toggle Debug Panel"
      >
        Debug Panel
      </button>
      <button
        className={pill(value.log)}
        onClick={() => onChange({ ...value, log: !value.log })}
        title="Toggle Log Auth"
      >
        Log Auth
      </button>
    </div>
  );
};

export default VisibilityToggles;