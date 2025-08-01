import { realmStore } from "../stores/realmStore";

let socket: WebSocket | null = null;

const WS_URL = import.meta.env.VITE_WS_URL;

export function connectRealmSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("[WS] Connected to realm status WebSocket");
    }

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data)) {
                realmStore.setRealms(data); // обновляем MobX store
            }
        } catch (error) {
            console.error("[WS] Invalid JSON:", error);
        }
    }

    socket.onerror = (err) => {
        console.error("[WS] Error:", err);
      };

    socket.onclose = (e) => {
        console.warn("[WS] Disconnected, retrying in 5s...", e.reason);
        setTimeout(connectRealmSocket, 5000);
    }
}