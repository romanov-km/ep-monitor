import React, { useEffect } from "react";
import { realmStore } from "../stores/realmStore";
import { observer } from "mobx-react-lite";

export const RealmStatusList: React.FC = observer(() => {

  useEffect(() => {
    realmStore.fetchRealms();
    const interval = setInterval(() => {realmStore.fetchRealms()}, 60000);
    return () => clearInterval(interval);
  }, []);

  if (realmStore.isLoading)
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        Loading realm statuses...
      </div>
    );

  return (
    <div className="flex p-4 px-2 justify-center">
      <div className="flex space-x-4 overflow-x-auto">
        {realmStore.realms.map((realm, idx) => {
          
          const date = new Date(realm.time);
          const isValidDate = !isNaN(date.getTime());

          return (
            <div
              key={idx}
              className=" border border-gray-600 rounded-md p-3 bg-gray-900 text-gray-300"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{realm.icon}</span>
                <span
                  className={`text-xs font-semibold ${
                    realm.status === "DOWN" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {realm.status}
                </span>
              </div>

              <div className="font-semibold text-sm truncate mb-1">
                {realm.name}
              </div>
              {isValidDate && (
                <div className="flex justify-between text-xs text-gray-400 ">
                  Last check:
                  <time>
                    {date.toLocaleString(undefined, {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </time>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
