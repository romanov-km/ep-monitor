import React from "react";
import { observer } from "mobx-react-lite";
import { uiStore } from "../stores/uiStore";

type PillProps = {
  active: boolean;
  onClick: () => void;
  title: string;
  children?: React.ReactNode;
};

const Pill: React.FC<PillProps> = ({ active, onClick, title, children }) => (
  <button
    className={`text-xs px-3 py-1 rounded-xl border transition select-none ${
      active ? "bg-emerald-700 text-white border-emerald-500" : "bg-black/40 text-gray-300 border-gray-600 hover:border-emerald-400"
    }`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

const VisibilityToggles: React.FC = observer(() => {
  const v = uiStore.visibility;
  const allOn = v.patch && v.realms && v.donate && v.logon && v.chart && v.chat;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Pill
        active={allOn}
        onClick={() => uiStore.setVisibility({ patch: !allOn, realms: !allOn, donate: !allOn, logon: !allOn, chart: !allOn,  chat: !allOn, debug: !allOn})}
        title={allOn ? "Hide all" : "Show all"}
      >{allOn ? "Hide all" : "Show all"}</Pill>
      <Pill
        active={v.chat}
        onClick={() => uiStore.toggle("chat")}
        title="Toggle Chat"
      >Chat</Pill>
      <Pill
        active={v.patch}
        onClick={() => uiStore.toggle("patch")}
        title="Toggle Patch"
      >Patch</Pill>
      <Pill
        active={v.realms}
        onClick={() => uiStore.toggle("realms")}
        title="Toggle Realms"
      >Realms</Pill>
      <Pill
        active={v.donate}
        onClick={() => uiStore.toggle("donate")}
        title="Toggle Donate"
      >Donate</Pill>
      <Pill
        active={v.logon}
        onClick={() => uiStore.toggle("logon")}
        title="Toggle Logon"
      >Logon</Pill>
      <Pill
        active={v.chart}
        onClick={() => uiStore.toggle("chart")}
        title="Toggle Logon"
      >Chart</Pill>
      <Pill
        active={v.debug}
        onClick={() => uiStore.toggle("debug")}
        title="Toggle Debug"
      >Debug</Pill>
      </div >
      )})

export default VisibilityToggles;