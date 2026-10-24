import {
  NETWORK,
  type ClientAction,
  type ServerMessage,
  type Session,
} from "../shared/protocol";
import { createActionId } from "../utils/actionId";
export type ConnectionStatus =
  | "connecting"
  | "online"
  | "offline"
  | "closed"
  | "superseded";
/** Authentification, reprise et heartbeat adaptés de useRoom dans Pendu Battle. */
export class RoomConnection {
  private socket?: WebSocket;
  private disposed = false;
  private halted = false;
  private retries = 0;
  private lastSeen = 0;
  private heartbeat?: ReturnType<typeof setInterval>;
  private timer?: ReturnType<typeof setTimeout>;
  private clientId = createActionId();
  private pending = new Map<string, ClientAction>();
  constructor(
    private session: Session,
    private onMessage: (message: ServerMessage) => void,
    private onStatus: (status: ConnectionStatus) => void,
  ) {}
  start() {
    window.addEventListener("online", this.resume);
    window.addEventListener("offline", this.offline);
    document.addEventListener("visibilitychange", this.resume);
    this.connect(true);
  }
  private offline = () => {
    this.onStatus("offline");
    this.socket?.close(4000, "Réseau indisponible");
  };
  private resume = () => {
    if (this.disposed || this.halted || document.visibilityState === "hidden")
      return;
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      clearTimeout(this.timer);
      this.connect(false);
    } else if (Date.now() - this.lastSeen > 20000)
      this.socket.close(4000, "Connexion inactive");
    else if (this.socket.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify({ type: "ping", sentAt: Date.now() }));
  };
  private connect(takeover: boolean) {
    if (this.disposed || this.halted) return;
    clearInterval(this.heartbeat);
    this.onStatus(this.retries ? "offline" : "connecting");
    const socket = new WebSocket(
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/rooms/${this.session.code}/socket`,
    );
    this.socket = socket;
    const current = () => !this.disposed && this.socket === socket;
    socket.onopen = () => {
      if (!current()) {
        socket.close();
        return;
      }
      this.lastSeen = Date.now();
      socket.send(
        JSON.stringify({
          type: "auth",
          token: this.session.token,
          clientId: this.clientId,
          takeover,
        }),
      );
      const ping = () => {
        if (!current() || socket.readyState !== WebSocket.OPEN) return;
        if (Date.now() - this.lastSeen > 20000) {
          socket.close(4000, "Connexion inactive");
          return;
        }
        socket.send(JSON.stringify({ type: "ping", sentAt: Date.now() }));
      };
      ping();
      this.heartbeat = setInterval(ping, NETWORK.heartbeat);
    };
    socket.onmessage = (event) => {
      if (!current()) return;
      this.lastSeen = Date.now();
      let message: ServerMessage;
      try {
        message = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }
      if (message.type === "room.state") {
        this.retries = 0;
        this.onStatus("online");
        for (const [id, action] of this.pending) {
          if ("raceId" in action && action.raceId !== message.view.raceId)
            this.pending.delete(id);
          else socket.send(JSON.stringify(action));
        }
      }
      if (message.type === "action.result")
        this.pending.delete(message.actionId);
      this.onMessage(message);
    };
    socket.onclose = (event) => {
      if (!current()) return;
      clearInterval(this.heartbeat);
      if (event.code === 4002 || event.code === 4001) {
        this.halted = true;
        this.onStatus(event.code === 4002 ? "superseded" : "closed");
        this.onMessage({
          type: "error",
          message: event.reason || "Cette session est terminée.",
          fatal: true,
        });
        return;
      }
      this.onStatus("offline");
      this.timer = setTimeout(
        () => this.connect(false),
        Math.min(500 * 2 ** this.retries++, 5000),
      );
    };
  }
  send(action: ClientAction) {
    if (this.socket?.readyState !== WebSocket.OPEN || this.halted) return false;
    if ("actionId" in action) this.pending.set(action.actionId, action);
    this.socket.send(JSON.stringify(action));
    return true;
  }
  reconnect() {
    this.halted = false;
    this.retries = 0;
    clearTimeout(this.timer);
    clearInterval(this.heartbeat);
    const old = this.socket;
    this.socket = undefined;
    old?.close();
    this.connect(true);
  }
  stop() {
    this.disposed = true;
    clearTimeout(this.timer);
    clearInterval(this.heartbeat);
    window.removeEventListener("online", this.resume);
    window.removeEventListener("offline", this.offline);
    document.removeEventListener("visibilitychange", this.resume);
    this.socket?.close(1000, "Page fermée");
  }
}
