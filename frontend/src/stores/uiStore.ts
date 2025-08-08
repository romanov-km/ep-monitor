import { makeAutoObservable } from "mobx";

export type Visibility = {
  patch: boolean;
  realms: boolean;
  donate: boolean;
  logon: boolean;
  chart: boolean;
  chat: boolean;
  debug: boolean;
};

const defaultVisibility: Visibility = {
  patch: true,
  realms: true,
  donate: true,
  logon: true,
  chart: true,
  chat: true,
  debug: true,
};

class UIStore {
  visibility: Visibility = (() => {
    try {
      return JSON.parse(localStorage.getItem("ui:visible") || "") || defaultVisibility;
    } catch {
      return defaultVisibility;
    }
  })();

  constructor() {
    makeAutoObservable(this);
  }

  setVisibility(v: Partial<Visibility>) {
    this.visibility = { ...this.visibility, ...v };
    localStorage.setItem("ui:visible", JSON.stringify(this.visibility));
  }

  toggle(key: keyof Visibility) {
    this.setVisibility({ [key]: !this.visibility[key] });
  }

  // Маппинг: какие виджеты нужны для событий
  isEventAllowed(event: "realmUp" | "realmDown" | "chat" | "patch" | "logon" | "chart" | "debug") {
    if (event === "realmUp" || event === "realmDown") return this.visibility.realms;
    if (event === "patch") return this.visibility.patch;
    if (event === "logon") return this.visibility.logon;
    if (event === "chat") return this.visibility.chat;
    if (event === "chart") return this.visibility.chart;
    if (event === "debug") return this.visibility.debug;
    return true;
  }
}

export const uiStore = new UIStore();