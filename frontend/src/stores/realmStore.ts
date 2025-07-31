import { makeAutoObservable } from "mobx";
import type { RealmStatus } from "../types/realm";
import { fetchRealmStatuses } from "../api/realm";

class RealmStore {
    realms: RealmStatus[] = [];
    isLoading = true;

    constructor() {
        makeAutoObservable(this);
    }

    async fetchRealms() {
        this.setLoading(true);
        try {
            const data = await fetchRealmStatuses();
            this.setRealms(data);
        } catch (e) {
            console.error("Ошибка:", e)
        } finally {
            this.setLoading(false)
        }
    }

    setRealms(data: RealmStatus[]) {
        this.realms = data;
        this.isLoading = false;
    }

    setLoading(value: boolean) {
        this.isLoading = value;
    }

}

export const realmStore = new RealmStore();

