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
  const deadlines = room.disconnectedAt.flatMap((at) =>
    at === null ? [] : [at + NETWORK.grace],
  );
  const deadline = Math.min(now, ...deadlines);
  advance(room.race, Math.max(0, deadline - room.startsAt));
  if (room.race.winner !== null) {
    room.reason = "finish";
    return;
  }
  if (deadlines.some((at) => at <= now)) {
    const missing = room.disconnectedAt.map((at) => at !== null);
    room.race.winner = missing[0] && missing[1] ? -1 : missing[0] ? 1 : 0;
    room.reason = missing[0] && missing[1] ? "interrupted" : "forfeit";
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
  room.race = createRace(crypto.getRandomValues(new Uint32Array(1))[0]);
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
  if (action.type === "ready") {
    if (room.race) return "La course est déjà lancée.";
    self.ready = action.ready;
    if (
      room.members.length === 2 &&
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
      room.members.length === 2 &&
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
      room.race.winner === null
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
