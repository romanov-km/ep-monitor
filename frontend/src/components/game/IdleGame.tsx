import React, { useEffect, useState } from "react";
import { translations } from "../../locales";

interface LootItem {
  name: string;
  rarity: "common" | "rare" | "epic";
  bonus?: string;
}

interface IdleGameProps {
  onStatsUpdate?: (stats: { level: number; gold: number; dps: number }) => void;
  language: "ru" | "en";
  onClose?: () => void;
}

interface Achievement {
  id: string;
  label: string;
  achieved: boolean;
}

const mobNames = {
  ru: [
    "Голодный гнолл",
    "Младший бес",
    "Грязный тролль",
    "Бродячий скелет",
    "Элементаль пыли",
    "Элитный охотник",
    "Босс Поганиус",
  ],
  en: [
    "Hungry Gnoll",
    "Young Imp",
    "Filthy Troll",
    "Wandering Skeleton",
    "Dust Elemental",
    "Elite Hunter",
    "Boss Filthion",
  ],
};

const getMobType = (level: number, lang: "ru" | "en") => {
  if (level % 10 === 0) return lang === "ru" ? "Босс" : "Boss";
  if (level % 5 === 0) return lang === "ru" ? "Элита" : "Elite";
  return lang === "ru" ? "Обычный" : "Normal";
};

const getMobIcon = (type: string) => {
  if (type === "Босс") return "👑";
  if (type === "Элита") return "💀";
  return "👾";
};

const getMobColor = (type: string) => {
  if (type === "Босс") return "text-red-400";
  if (type === "Элита") return "text-yellow-300";
  return "text-white";
};

const getRandomMobName = (lang: "ru" | "en") => {
  return mobNames[lang][Math.floor(Math.random() * mobNames[lang].length)];
};

const randomLoot = (lang: "ru" | "en"): LootItem => {
  const t = translations[lang].idleGame;
  const chance = Math.random();
  if (chance < 0.6) {
    return {
      name: t.loot1,
      rarity: "common",
      bonus: t.bonus1,
    };
  }
  if (chance < 0.9) {
    return {
      name: t.loot2,
      rarity: "rare",
      bonus: t.bonus2,
    };
  }
  return {
    name: t.loot3,
    rarity: "epic",
    bonus: t.bonus3,
  };
};

const IdleGame: React.FC<IdleGameProps> = ({
  onStatsUpdate,
  language,
  onClose,
}) => {
  const [gold, setGold] = useState(0);
  const [clickDmg, setClickDmg] = useState(1);
  const [dps, setDps] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [loot, setLoot] = useState<LootItem | null>(null);
  const [chestReady, setChestReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [mobHp, setMobHp] = useState(20);
  const [mobMaxHp, setMobMaxHp] = useState(20);
  const [mobLevel, setMobLevel] = useState(1);
  const [mobName, setMobName] = useState(getRandomMobName(language));
  const [deathAnim, setDeathAnim] = useState(false);
  const [autoHitVisible, setAutoHitVisible] = useState(false);
  const [critText, setCritText] = useState("");
  const [petUnlocked, setPetUnlocked] = useState(false);
  const [petLevel, setPetLevel] = useState(1);
  const [petDps, setPetDps] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([{
    id: "first-click",
    label: language === "en" ? "First Click" : "Первый удар" ,
    achieved: false,
  }, {
    id: "gold-300",
    label: language === "en" ? "Collect 300 Gold" : "Накопи 300 золота" ,
    achieved: false,
  }, {
    id: "level-100",
    label: language === "en" ? "Reach Level 100" : "Достигни 100 уровня" ,
    achieved: false,
  }, {
    id: "insane-click",
    label: language === "en" ? "INSANE 100k Clicks" : "Невороятный удар" ,
    achieved: false,
  }]);
  const [petStones, setPetStones] = useState(0);
  if (Math.random() < 0.15) setPetStones(s => s + 1);

  const petUpgradeCost = 20 * petLevel;
  const stoneCost = 2 + Math.floor(petLevel / 2);
  const successChance = Math.max(50, 100 - petLevel * 3); // Минимум 50%

  const handlePetUpgrade = () => {
    if (gold >= petUpgradeCost && petStones >= stoneCost && petUnlocked) {
      setGold(g => g - petUpgradeCost);
      setPetStones(s => s - stoneCost);

      if (Math.random() * 100 < successChance) {
        setPetLevel(lvl => lvl + 1);
        setPetDps(dps => dps + 1 + Math.floor(Math.random() * 2)); // иногда +2
      } else {
        setGold(g => g - petUpgradeCost / 2); // штраф за неудачу
        setPetLevel(lvl => Math.max(1, lvl - 1)); // деградация уровня
      }
    }
  };

  useEffect(() => {
    const savedGold = localStorage.getItem("gold");
    const savedClickDmg = localStorage.getItem("clickDmg");
    const savedDps = localStorage.getItem("dps");
    const savedClicks = localStorage.getItem("clicks");
    const savedPet = localStorage.getItem("petUnlocked");
    const savedPetLevel = localStorage.getItem("petLevel");
    const savedPetDps = localStorage.getItem("petDps");

    if (savedGold) setGold(parseInt(savedGold));
    if (savedClickDmg) setClickDmg(parseInt(savedClickDmg));
    if (savedDps) setDps(parseInt(savedDps));
    if (savedClicks) setClicks(parseInt(savedClicks));
    if (savedPet) setPetUnlocked(savedPet === "true");
    if (savedPetLevel) setPetLevel(parseInt(savedPetLevel));
    if (savedPetDps) setPetDps(parseInt(savedPetDps));
  }, []);

  useEffect(() => {
    localStorage.setItem("gold", gold.toString());
    localStorage.setItem("clickDmg", clickDmg.toString());
    localStorage.setItem("dps", dps.toString());
    localStorage.setItem("clicks", clicks.toString());
    localStorage.setItem("petUnlocked", petUnlocked.toString());
    localStorage.setItem("petLevel", petLevel.toString());
    localStorage.setItem("petDps", petDps.toString());
  }, [gold, clickDmg, dps, clicks, petUnlocked, petLevel, petDps]);

  const handleMobDeath = () => {
    const baseReward = 5 + mobLevel * 2;
    const bonus = mobType === "Босс" ? 20 : mobType === "Элита" ? 10 : 0;
    const totalReward = baseReward + bonus;
    setGold((g) => g + totalReward);
    const newMax = Math.floor(
      mobMaxHp * (mobType === "Босс" ? 1.6 : mobType === "Элита" ? 1.4 : 1.2)
    );
    setMobMaxHp(newMax);
    setMobHp(newMax);
    setMobLevel((lvl) => {
      const nextLevel = lvl + 1;
      if (!petUnlocked && nextLevel >= 10) {
        setPetUnlocked(true);
        setPetDps(1);
      }
      return nextLevel;
    });
    setMobName(getRandomMobName(language));
    setDeathAnim(true);
    setTimeout(() => setDeathAnim(false), 400);
    onStatsUpdate?.({
      level: mobLevel,
      gold: gold,
      dps: dps + (petUnlocked ? petDps : 0),
    });
  };

  const handleClick = () => {
    const isCrit = Math.random() < 0.1;
    const dmg = isCrit ? clickDmg * 2 : clickDmg;
    if (isCrit) {
      setCritText("CRIT!");
      setTimeout(() => setCritText(""), 500);
    }

    setClicks((c) => {
      const next = c + 1;
      if (next % 15 === 0) setChestReady(true);
      return next;
    });
    setMobHp((hp) => {
      const newHp = hp - dmg;
      if (newHp <= 0) {
        handleMobDeath();
      }
      return Math.max(newHp, 0);
    });
  };

  const handleUpgrade = () => {
    if (gold >= 10) {
      setGold((g) => g - 10);
      setClickDmg((d) => d + 1);
    }
  };

  const handleOpenChest = () => {
    const item = randomLoot(language);
    setLoot(item);
    setChestReady(false);

    if (item.rarity === "common") setGold((g) => g + 5);
    if (item.rarity === "rare") setClickDmg((d) => d + 1);
    if (item.rarity === "epic") setDps((d) => d + 1);

    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        const totalDps = dps + (petUnlocked ? petDps : 0);
        setMobHp((hp) => {
          const newHp = hp - totalDps;
          if (newHp <= 0) {
            handleMobDeath();
            return mobMaxHp;
          }
          return Math.max(newHp, 0);
        });
        if (totalDps > 0) {
          setAutoHitVisible(true);
          setTimeout(() => setAutoHitVisible(false), 300);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dps, petDps, petUnlocked, mobLevel, mobMaxHp]);

  const mobType = getMobType(mobLevel, language);
  const mobIcon = getMobIcon(mobType);
  const mobColor = getMobColor(mobType);
  const t = translations[language].idleGame;

  useEffect(() => {
    if (critText && critText !== (language === "ru" ? "КРИТ!" : "CRIT!")) {
      setCritText(language === "ru" ? "КРИТ!" : "CRIT!");
    }
  }, [language]);

  useEffect(() => {
    if (clicks > 0 && !achievements.find(a => a.id === "first-click")?.achieved) {
      setAchievements(prev => prev.map(a => a.id === "first-click" ? { ...a, achieved: true } : a));
    }
    if (gold >= 300 && !achievements.find(a => a.id === "gold-300")?.achieved) {
      setAchievements(prev => prev.map(a => a.id === "gold-300" ? { ...a, achieved: true } : a));
    }
    if (mobLevel >= 100 && !achievements.find(a => a.id === "level-100")?.achieved) {
      setAchievements(prev => prev.map(a => a.id === "level-100" ? { ...a, achieved: true } : a));
    }
    if (clicks >= 100000 && !achievements.find(a => a.id === "insane-click")?.achieved) {
      setAchievements(prev => prev.map(a => a.id === "insane-click" ? { ...a, achieved: true } : a));
    }
  }, [clicks, gold, mobLevel]);

  return (
    
    <div className="p-4 text-white bg-gray-900 min-h-screen font-mono relative overflow-hidden">
      <h1 className="text-2xl font-bold mb-4 z-20 relative">{t.title}</h1>
      
      {flash && (
        <div className="absolute inset-0 bg-yellow-300 opacity-20 animate-ping z-10"></div>
      )}

      <div className="mb-2 z-20 relative">
        {t.gold}: {gold}
      </div>
      <div className="mb-2 z-20 relative">
        {t.clickDamage}: {clickDmg}
      </div>
      <div className="mb-2 z-20 relative">
        {t.dps}: {dps}
      </div>
      {petUnlocked && (
        <div className="mb-2 z-20 relative">
          {t.pet}: {petLevel} {t.level} — {petDps} {t.dps}
          <span className="ml-4 text-yellow-300 text-xs">
            {t.petUpgrade}: {petUpgradeCost} {t.gold}
          </span>
        </div>
      )}
      <div className="mb-2 z-20 relative text-sm text-blue-400">
        {t.autoHit}: -{dps + (petUnlocked ? petDps : 0)} {t.hp} / {t.dps}
      </div>

      <div
        className={`mb-2 z-20 relative transition-all duration-300 ${
          deathAnim ? "opacity-0 scale-50" : "opacity-100 scale-100"
        }`}
      >
        <span className={`font-bold ${mobColor}`}>
          {mobIcon} [{mobType}] {mobName}
        </span>{" "}
        — {t.level}: {mobLevel}: {mobHp} / {mobMaxHp} {t.hp}
      </div>

      {critText && (
        <div className="absolute left-1/2 top-24 text-yellow-400 text-xl font-bold animate-bounce z-30">
          {critText}
        </div>
      )}

      {autoHitVisible && dps + (petUnlocked ? petDps : 0) > 0 && (
        <div className="absolute left-1/2 top-40 text-red-400 text-lg font-bold animate-bounce z-30">
          -{dps + (petUnlocked ? petDps : 0)}
        </div>
      )}

      <div className="w-full bg-gray-700 rounded h-4 mb-4 z-20 relative">
        <div
          className="bg-red-500 h-4 rounded transition-all duration-300"
          style={{ width: `${(mobHp / mobMaxHp) * 100}%` }}
        ></div>
      </div>

      <button
        onClick={handleClick}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white mb-2 z-20 relative"
      >
        {t.hitButton}
      </button>

      <div className="mb-4 z-20 relative">
        <button
          onClick={handleUpgrade}
          disabled={gold < 10}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
        >
          {t.upgrade}
        </button>
      </div>

      {chestReady && (
        <div className="mb-4 z-20 relative">
          <button
            onClick={handleOpenChest}
            className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-black"
          >
            {t.openChest}
          </button>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center z-30"
          title="Закрыть игру"
        >
          ✖
        </button>
      )}

      {loot && (
        <div className="mt-4 text-sm z-20 relative">
          {t.lastLoot}:{" "}
          <span
            className={`font-bold ${
              loot.rarity === "common"
                ? "text-gray-300"
                : loot.rarity === "rare"
                ? "text-blue-400"
                : "text-purple-400"
            }`}
          >
            {loot.name}
          </span>
          {loot.bonus && (
            <div className="text-green-400">
              {t.bonus}: {loot.bonus}
            </div>
          )}
        </div>
      )}

      {petUnlocked && (
        <div className="mb-4 z-20 relative">
          <button
            onClick={handlePetUpgrade}
            disabled={gold < petUpgradeCost || petStones < stoneCost}
            className="bg-yellow-700 hover:bg-yellow-800 px-4 py-2 rounded disabled:opacity-50"
          >
            {t.petUpgrade} ({petUpgradeCost} {t.gold} + {stoneCost} 🪨, {successChance}%)
          </button>
          <div className="text-xs text-gray-400 mt-1">
            {t.petStones}: {petStones}
          </div>
        </div>
      )}

      <div className="mb-2 z-20 relative">🎯 Achievements:</div>
        <ul className="mb-4 z-20 relative list-disc pl-5 text-sm">
          {achievements.map((a) => (
            <li key={a.id} className={a.achieved ? "text-green-400" : "text-gray-400"}>{a.label}</li>
          ))}
      </ul>
    </div>
  );
};

export default IdleGame;
