import axios from "axios";
import type { RealmStatus } from "../types/realm";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchRealmStatuses(): Promise<RealmStatus[]>  {
    const res = await axios.get(`${API_BASE}/api/realm-status`);
    return res.data;
}