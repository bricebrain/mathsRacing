import { actionSchema, nameSchema } from "./validation";
import { readRoom, saveRoom } from "./roomStorage";
import { DurableObject } from "cloudflare:workers";
import { CAR_COLORS } from "../src/engine/config";
import {
  NETWORK,
  type PlayerId,
  type ServerMessage,
} from "../src/shared/protocol";
import { makeRoom, member, type Room } from "./model";
import { advanceRoom, applyRoomAction, connectionChanged } from "./match";
import { roomView } from "./view";
import {
  claimConnection,
  secureTokenEquals,
  type Attachment,
} from "./connections";
export class RacingRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)",
    );
  }
  private connected(): PlayerId[] {
    return this.ctx.getWebSockets().flatMap((socket) => {
      const attachment = socket.deserializeAttachment() as Attachment;
      return attachment.playerId !== null && socket.readyState === 1
        ? [attachment.playerId]
        : [];
    });
  }
  private send(socket: WebSocket, message: ServerMessage) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      /* Fermeture simultanée. */
    }
  }
  private broadcast(room: Room) {
    const connected = this.connected(),
      now = Date.now();
    for (const socket of this.ctx.getWebSockets()) {
      const id = (socket.deserializeAttachment() as Attachment).playerId;
      if (id !== null)
        this.send(socket, {
          type: "room.state",
          view: roomView(room, id, connected, now),
        });
    }
  }
  private schedule(room: Room) {
    const now = Date.now();
    const active = room.race && room.race.winner === null;
    const authDeadlines = this.ctx.getWebSockets().flatMap((socket) => {
      const attachment = socket.deserializeAttachment() as Attachment;
      return attachment.playerId === null ? [attachment.openedAt + 10000] : [];
    });
    return this.ctx.storage.setAlarm(
      Math.max(
        now + 1,
        Math.min(
          room.expiresAt,
          now + (active ? NETWORK.snapshot : 10000),
          ...authDeadlines,
        ),
      ),
    );
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url),
      now = Date.now();
    const parsed = request.method === "POST" ? nameSchema.safeParse(
      (await request.json<{ name?: string }>()).name,
    ) : null;
    let room = readRoom(this.ctx.storage);
    if (room && room.expiresAt <= now)
      return Response.json({ error: "Cette salle a expiré." }, { status: 410 });
    if (request.method === "POST") {
      if (!parsed?.success)
        return Response.json(
          { error: "Choisis un pseudo de 1 à 16 caractères." },
          { status: 400 },
        );
      if (url.pathname.endsWith("/create")) {
        if (room)
          return Response.json({ error: "Code occupé." }, { status: 409 });
        room = makeRoom(url.pathname.split("/")[3], parsed.data, now);
      } else {
        if (!room)
          return Response.json(
            { error: "Salle introuvable." },
            { status: 404 },
          );
        if (room.members.length >= room.capacity || room.race)
          return Response.json(
            { error: "Cette salle est déjà complète." },
            { status: 409 },
          );
        room.members.push(
          member(
            room.members.length as PlayerId,
            parsed.data,
            CAR_COLORS.find((color) => room!.members.every((member) => member.color !== color))!,
          ),
        );
      }
      saveRoom(this.ctx.storage, room);
      this.broadcast(room);
      await this.schedule(room);
      const joined = room.members.at(-1)!;
      return Response.json(
        { code: room.code, token: joined.token, playerId: joined.id },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!room)
      return Response.json({ error: "Salle introuvable." }, { status: 404 });
    if (url.pathname.endsWith("/session")) {
      const token =
        request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
      return room.members.some((member) =>
        secureTokenEquals(member.token, token),
      )
        ? Response.json(
            { ok: true },
            { headers: { "Cache-Control": "no-store" } },
          )
        : Response.json({ error: "Session invalide." }, { status: 401 });
    }
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
      return new Response("WebSocket attendu", { status: 426 });
    if (this.ctx.getWebSockets().length >= 8)
      return new Response("Trop de connexions", { status: 429 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({
      playerId: null,
      openedAt: now,
      lastAt: now,
      count: 0,
      windowAt: now,
    } satisfies Attachment);
    await this.schedule(room);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== "string" || raw.length > 2048) {
      socket.close(1009, "Message trop long");
      return;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      this.send(socket, { type: "error", message: "Message invalide." });
      return;
    }
    const parsed = actionSchema.safeParse(json);
    if (!parsed.success) {
      this.send(socket, { type: "error", message: "Action invalide." });
      return;
    }
    const room = readRoom(this.ctx.storage),
      now = Date.now(),
      action = parsed.data;
    if (!room || room.expiresAt <= now) {
      socket.close(4001, "Salle expirée");
      return;
    }
    const attachment = socket.deserializeAttachment() as Attachment;
    if (now - attachment.windowAt >= 1000) {
      attachment.windowAt = now;
      attachment.count = 0;
    }
    if (++attachment.count > 15) {
      socket.serializeAttachment(attachment);
      this.send(socket, { type: "error", message: "Un peu moins vite !" });
      return;
    }
    attachment.lastAt = now;
    if (attachment.playerId === null) {
      if (action.type !== "auth") {
        socket.close(4001, "Authentification requise");
        return;
      }
      const member = room.members.find((member) =>
        secureTokenEquals(member.token, action.token),
      );
      if (!member) {
        socket.close(4001, "Session invalide");
        return;
      }
      if (
        !claimConnection(
          this.ctx.getWebSockets(),
          socket,
          member.id,
          action.takeover === true,
          action.clientId,
        )
      )
        return;
      attachment.playerId = member.id;
      attachment.clientId = action.clientId;
      connectionChanged(room, member.id, true, now);
    } else if (action.type === "ping") {
      socket.serializeAttachment(attachment);
      this.send(socket, {
        type: "pong",
        serverTime: now,
        sentAt: action.sentAt,
      });
      return;
    } else {
      const result = applyRoomAction(
        room,
        attachment.playerId,
        action,
        now,
        this.connected(),
      );
      if (typeof result === "string")
        this.send(socket, { type: "error", message: result });
      else if (result) this.send(socket, result);
    }
    socket.serializeAttachment(attachment);
    room.expiresAt = now + NETWORK.ttl;
    saveRoom(this.ctx.storage, room);
    this.broadcast(room);
    await this.schedule(room);
  }
  async webSocketClose(socket: WebSocket) {
    const attachment = socket.deserializeAttachment() as Attachment;
    socket.serializeAttachment({ ...attachment, playerId: null });
    try {
      socket.close(1000, "Connexion fermée");
    } catch {
      /* Déjà fermé. */
    }
    const room = readRoom(this.ctx.storage);
    if (!room) return;
    if (
      attachment.playerId !== null &&
      !this.connected().includes(attachment.playerId)
    )
      connectionChanged(room, attachment.playerId, false, Date.now());
    saveRoom(this.ctx.storage, room);
    this.broadcast(room);
    await this.schedule(room);
  }
  async webSocketError(socket: WebSocket) {
    await this.webSocketClose(socket);
  }
  async alarm() {
    const room = readRoom(this.ctx.storage),
      now = Date.now();
    if (!room) return;
    if (now >= room.expiresAt) {
      for (const socket of this.ctx.getWebSockets())
        socket.close(4001, "Salle expirée");
      this.ctx.storage.sql.exec("DELETE FROM room");
      return;
    }
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socket.deserializeAttachment() as Attachment;
      if (
        (attachment.playerId === null && now - attachment.openedAt > 10000) ||
        now - attachment.lastAt > 25000
      ) {
        socket.serializeAttachment({ ...attachment, playerId: null });
        socket.close(4000, "Connexion inactive");
      }
    }
    const connected = this.connected();
    for (const member of room.members) {
      if (
        !connected.includes(member.id) &&
        room.disconnectedAt[member.id] === null
      )
        connectionChanged(room, member.id, false, now);
    }
    advanceRoom(room, now);
    saveRoom(this.ctx.storage, room);
    this.broadcast(room);
    await this.schedule(room);
  }
}
