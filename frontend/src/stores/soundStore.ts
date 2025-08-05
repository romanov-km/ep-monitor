import { makeAutoObservable } from "mobx";

export interface SoundEvent {
  enabled: boolean;
  soundType: string;
  volume: number;
}

export interface AppSoundSettings {
  realmUp: SoundEvent;
  authUp: SoundEvent;
  chat: SoundEvent;
  realmDown: SoundEvent;
}

const defaultSettings: AppSoundSettings = {
  realmUp: { enabled: true, soundType: "70elite", volume: 1 },
  authUp: { enabled: true, soundType: "levelup", volume: 1 },
  chat: { enabled: true, soundType: "newmsg", volume: 0.6 },
  realmDown: { enabled: true, soundType: "down", volume: 1 },
};

class SoundStore {
  soundSettings: AppSoundSettings = (() => {
    const saved = localStorage.getItem("soundSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.realmDown) parsed.realmDown = defaultSettings.realmDown;
      return parsed;
    }
    return defaultSettings;
  })();
  audioCache: Record<string, HTMLAudioElement> = {};

  userInteracted = false;

  constructor() {
    makeAutoObservable(this);
  }

  setSoundSettings(settings: AppSoundSettings) {
    this.soundSettings = settings;
    localStorage.setItem("soundSettings", JSON.stringify(settings));
  }

  setUserInteracted(value: boolean) {
    this.userInteracted = value;
  }

  updateEvent(event: keyof AppSoundSettings, updates: Partial<SoundEvent>) {
    this.setSoundSettings({
      ...this.soundSettings,
      [event]: { ...this.soundSettings[event], ...updates },
    });
  }

preloadAllSounds() {
  Object.values(this.soundSettings).forEach((config) => {
    const ext = config.soundType === "newmsg" ? ".ogg" : ".mp3";
    const path = `/sounds/${config.soundType}${ext}`;
    if (!this.audioCache[path]) {
      const audio = new Audio(path);
      audio.preload = "auto";
      // Явно инициируем загрузку
      audio.load();
      audio.oncanplaythrough = () => {
        console.log(`${path} загружен`);
      };
      audio.onerror = (e) => {
        console.error(`Ошибка загрузки звука: ${path}`, e);
      };
      this.audioCache[path] = audio;
    }
  });
}

  play(event: keyof AppSoundSettings) {
    if (!this.userInteracted) {
      console.log("🔇 Audio blocked: user hasn't interacted with page yet");
      return;
    }

    const config = this.soundSettings[event];
    if (!config.enabled || !this.userInteracted) return;

    const ext = config.soundType === "newmsg" ? ".ogg" : ".mp3";
    const path = `/sounds/${config.soundType}${ext}`;

    const audio = this.audioCache[path] ?? new Audio(path);
    audio.volume = config.volume;
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Audio play error:", err));

    this.audioCache[path] = audio;
  }


  stop() {
    Object.values(this.audioCache).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  playTestSound(event: keyof AppSoundSettings) {
    this.play(event);
  }

  toggleEventEnabled(event: keyof AppSoundSettings) {
    const current = this.soundSettings[event];
    this.updateEvent(event, { enabled: !current.enabled });
  }
}

export const soundStore = new SoundStore();