import { API_BASE } from "./api";

type Listener = (event: string, data: any) => void;

class RealtimeSyncManager {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private clientId: string = `client-${Math.random().toString(36).substring(2, 9)}`;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = API_BASE.replace(/^http/, "ws") + `/ws/${this.clientId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log("Realtime WebSocket connected:", this.clientId);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.event && payload.event !== "pong") {
            this.notifyListeners(payload.event, payload.data);
          }
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: string, data: any) {
    this.listeners.forEach((fn) => {
      try {
        fn(event, data);
      } catch (err) {
        console.error("Realtime listener error:", err);
      }
    });
  }

  public isWsConnected() {
    return this.isConnected;
  }
}

export const realtimeSync = new RealtimeSyncManager();
