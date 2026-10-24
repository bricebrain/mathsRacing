import { THEME_IDS } from "../src/constants/themes";
import { RACE } from "../src/engine/config";
import { advance, createRace, skipOperation, submit } from "../src/engine/race";
import {
  NETWORK,
  type ActionResult,
  type ClientAction,
  type PlayerId,
} from "../src/shared/protocol";
import type { Room } from "./model";
export function advanceRoom(room: Room, now: number) {
  if (
    !room.race ||
    room.startsAt === null ||
    now < room.startsAt ||
    room.race.winner !== null
  )
    return;
  const race = room.race;
  while (race.winner === null) {
    const deadlines = room.members.flatMap((member) => {
      const at = room.disconnectedAt[member.id];
      return at == null || race.players[member.id].eliminatedAt != null ? [] : [at + NETWORK.grace];
    });
    const stopAt = Math.min(now, ...deadlines);
    advance(race, Math.max(0, stopAt - room.startsAt));
    if (race.winner !== null) {
      room.reason = "finish";
      return;
    }
    const expired = room.members.filter((member) => {
      const at = room.disconnectedAt[member.id];
      return at != null && at + NETWORK.grace <= stopAt && race.players[member.id].eliminatedAt == null;
    });
    if (!expired.length) return;
    expired.forEach((member) => {
      const player = race.players[member.id];
      player.eliminatedAt = race.time;
      player.correctionUntil = null;
      player.boost = 0;
    });
    const remaining = room.members.filter((member) => race.players[member.id].eliminatedAt == null);
    if (!remaining.length || (remaining.length === 1 && room.disconnectedAt[remaining[0].id] == null)) {
      race.winners = remaining.map((member) => member.id);
      race.winner = remaining[0]?.id ?? -1;
      room.reason = remaining.length ? "forfeit" : "interrupted";
      return;
    }
  }
}
export function connectionChanged(
  room: Room,
  id: PlayerId,
  connected: boolean,
  now: number,
) {
  advanceRoom(room, now);
  room.disconnectedAt[id] = connected ? null : (room.disconnectedAt[id] ?? now);
  if (connected && room.race && room.race.winner === null) {
    const remaining = room.members.filter((member) => room.race!.players[member.id].eliminatedAt == null);
    if (remaining.length === 1 && remaining[0].id === id) {
      room.race.winner = id;
      room.race.winners = [id];
      room.reason = "forfeit";
    }
  }
  if (!connected && (room.startsAt === null || now < room.startsAt)) {
    room.members.forEach((member) => {
      member.ready = false;
    });
    room.race = null;
    room.raceId = null;
    room.startsAt = null;
    room.receipts = [];
  }
}
function begin(room: Room, now: number) {
  room.race = createRace(crypto.getRandomValues(new Uint32Array(1))[0], room.themes ?? [room.mode ?? "math"], room.laps ?? 3, room.capacity ?? 2);
  room.raceId = crypto.randomUUID();
  room.startsAt = now + RACE.countdown;
  room.reason = null;
  room.receipts = [];
  room.members.forEach((member) => {
    member.ready = false;
    member.rematch = false;
  });
}
export function applyRoomAction(
  room: Room,
  id: PlayerId,
  action: ClientAction,
  now: number,
  connected: PlayerId[],
): ActionResult | string | null {
  advanceRoom(room, now);
  const self = room.members.find((member) => member.id === id);
  if (!self) return "Joueur inconnu.";
  if (action.type === "capacity") {
    if (room.race) return "Le nombre de joueurs est fixé pour cette course.";
    if (id !== 0) return "Seul le créateur choisit le nombre de joueurs.";
    if (action.capacity < room.members.length) return "Des joueurs occupent déjà ces places.";
    if (action.capacity === (room.capacity ?? 2)) return null;
    room.capacity = action.capacity;
    room.disconnectedAt = Array.from({ length: action.capacity }, (_, index) => room.disconnectedAt[index] ?? null);
    room.members.forEach((member) => { member.ready = false; });
  } else if (action.type === "laps") {
    if (room.race) return "Le nombre de tours est fixé pour cette course.";
    if (id !== 0) return "Seul le créateur de la salle choisit le nombre de tours.";
    if (action.laps === (room.laps ?? 3)) return null;
    room.laps = action.laps;
    room.members.forEach((member) => { member.ready = false; });
  } else if (action.type === "mode" || action.type === "themes" || action.type === "theme") {
    if (room.race) return "Les thèmes sont fixés pour cette course.";
    if (id !== 0) return "Seul le créateur de la salle choisit les thèmes.";
    const current = room.themes ?? [room.mode ?? "math"];
    const selected = action.type === "mode" ? [action.mode]
      : action.type === "themes" ? action.themes
        : action.selected ? [...current, action.theme] : current.filter((theme) => theme !== action.theme);
    const themes = THEME_IDS.filter((theme) => selected.includes(theme));
    if (!themes.length) return "Choisis au moins un thème.";
    if (JSON.stringify(themes) === JSON.stringify(room.themes ?? [room.mode])) return null;
    room.themes = themes;
    room.mode = themes[0];
    room.members.forEach((member) => { member.ready = false; });
  } else if (action.type === "ready") {
    if (room.race) return "La course est déjà lancée.";
    self.ready = action.ready;
    if (
      room.members.length === (room.capacity ?? 2) &&
      room.members.every(
        (member) => member.ready && connected.includes(member.id),
      )
    )
      begin(room, now);
  } else if (action.type === "color") {
    if (room.race || self.ready)
      return "Change de couleur avant de te déclarer prêt.";
    if (
      room.members.some(
        (member) => member.id !== id && member.color === action.color,
      )
    )
      return "Cette couleur est déjà prise.";
    self.color = action.color;
  } else if (action.type === "rematch") {
    if (!room.race || room.race.winner === null)
      return "La course doit être terminée.";
    self.rematch = action.ready;
    if (
      room.members.length === (room.capacity ?? 2) &&
      room.members.every(
        (member) => member.rematch && connected.includes(member.id),
      )
    )
      begin(room, now);
  } else if (action.type === "answer" || action.type === "skip") {
    const receipt = room.receipts.find(
      (item) => item.playerId === id && item.ack.actionId === action.actionId,
    );
    if (receipt) return receipt.ack;
    let status: ActionResult["status"] = "ignored";
    if (
      room.race &&
      room.raceId === action.raceId &&
      room.startsAt !== null &&
      now >= room.startsAt &&
      room.race.winner === null &&
      room.race.players[id]?.eliminatedAt == null
    ) {
      const time = now - room.startsAt;
      status =
        action.type === "answer"
          ? submit(room.race, id, action.value, action.operationId, time)
          : skipOperation(room.race, id, action.operationId, time)
            ? "skipped"
            : "ignored";
    }
    const ack: ActionResult = {
      type: "action.result",
      actionId: action.actionId,
      raceId: action.raceId,
      status,
    };
    room.receipts.push({ playerId: id, ack });
    if (room.receipts.length > 128) room.receipts.shift();
    if (room.race?.winner !== null && room.race) room.reason ??= "finish";
    return ack;
  }
  return null;
}
