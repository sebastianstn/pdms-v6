/**
 * WebSocket Manager for real-time vitals and alarms.
 * Features auto-reconnect with exponential backoff.
 */

function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window === "undefined") return "ws://localhost:3000";
  // Use same host/port as the page — WebSocket goes through Next.js rewrites
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

type MessageHandler = (data: unknown) => void;

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  connect(path: string, onMessage: MessageHandler): () => void {
    const url = `${getWsBase()}/ws${path}`;
    let reconnectDelay = INITIAL_RECONNECT_DELAY;
    let intentionallyClosed = false;

    const createConnection = () => {
      if (intentionallyClosed) return;

      const ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectDelay = INITIAL_RECONNECT_DELAY; // Reset on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          console.warn("WebSocket: invalid JSON", event.data);
        }
      };

      ws.onclose = () => {
        this.connections.delete(path);
        if (!intentionallyClosed) {
          // Auto-reconnect with exponential backoff
          const timer = setTimeout(() => {
            createConnection();
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
          }, reconnectDelay);
          this.reconnectTimers.set(path, timer);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      this.connections.set(path, ws);
    };

    createConnection();

    // Return cleanup function
    return () => {
      intentionallyClosed = true;
      const timer = this.reconnectTimers.get(path);
      if (timer) {
        clearTimeout(timer);
        this.reconnectTimers.delete(path);
      }
      const ws = this.connections.get(path);
      if (ws) {
        ws.close();
        this.connections.delete(path);
      }
    };
  }

  disconnect(path: string) {
    const timer = this.reconnectTimers.get(path);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(path);
    }
    const ws = this.connections.get(path);
    if (ws) {
      ws.close();
      this.connections.delete(path);
    }
  }

  disconnectAll() {
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    this.reconnectTimers.clear();
    for (const ws of this.connections.values()) ws.close();
    this.connections.clear();
  }
}

export const wsManager = new WebSocketManager();
