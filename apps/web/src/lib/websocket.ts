/**
 * WebSocket Manager for real-time vitals and alarms.
 */

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

type MessageHandler = (data: unknown) => void;

class WebSocketManager {
  private connections = new Map<string, WebSocket>();

  connect(path: string, onMessage: MessageHandler): () => void {
    const url = `${WS_BASE}${path}`;
    const ws = new WebSocket(url);

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
      // TODO: auto-reconnect with backoff
    };

    this.connections.set(path, ws);

    // Return cleanup function
    return () => {
      ws.close();
      this.connections.delete(path);
    };
  }

  disconnect(path: string) {
    const ws = this.connections.get(path);
    if (ws) {
      ws.close();
      this.connections.delete(path);
    }
  }

  disconnectAll() {
    for (const ws of this.connections.values()) ws.close();
    this.connections.clear();
  }
}

export const wsManager = new WebSocketManager();
