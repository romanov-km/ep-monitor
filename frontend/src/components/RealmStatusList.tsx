import React, { useEffect } from "react";
import { realmStore } from "../stores/realmStore";
import { observer } from "mobx-react-lite";
import { RealmCard } from "./RealmCard";

export const RealmStatusList: React.FC = observer(() => {

  useEffect(() => {
    realmStore.fetchRealms();
    const interval = setInterval(() => {realmStore.fetchRealms()}, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex p- p-2 justify-center">
      <div className="grid grid-cols-1 sm:flex sm:space-x-4 overflow-x-auto">
      {realmStore.realms.map((realm) => (
          <RealmCard
            key={realm.name}
            name={realm.name}
            icon={realm.icon}
            status={realm.status}
            time={realm.time}
          />
        ))}
      </div>
    </div>
  );
});
