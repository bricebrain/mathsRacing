import { describe, expect, it } from "vitest";
import { advanceRoom, applyRoomAction, connectionChanged } from "./match";
import { makeRoom, member } from "./model";
import { roomView } from "./view";
import { actionSchema } from "./validation";
import { answer } from "../src/engine/questions";
import type { PlayerCount } from "../src/engine/config";
import type { PlayerId } from "../src/shared/protocol";
const now = 100000;
function lobby(capacity: PlayerCount) {
  const room = makeRoom("ABC234", "Alice", now);
  applyRoomAction(room, 0, { type: "capacity", capacity }, now, [0]);
  for (let id = 1; id < capacity; id++) room.members.push(member(id as PlayerId, `Pilote ${id + 1}`));
  return room;
}
function started(capacity: PlayerCount) {
  const room = lobby(capacity);
  const ids = room.members.map((m) => m.id);
  for (const id of ids) applyRoomAction(room, id, { type: "ready", ready: true }, now, ids);
  return room;
}
describe("salles jusqu’à quatre joueurs", () => {
  it("limite la capacité à 2, 3 ou 4 et réserve son choix au créateur", () => {
    const room = makeRoom("ABC234", "Alice", now);
    expect(room.capacity).toBe(2);
    for (const capacity of [2, 3, 4]) expect(actionSchema.safeParse({ type: "capacity", capacity }).success).toBe(true);
    for (const capacity of [0, 1, 5, 3.5, "4"]) expect(actionSchema.safeParse({ type: "capacity", capacity }).success).toBe(false);
    room.members.push(member(1, "Bob"));
    expect(applyRoomAction(room, 1, { type: "capacity", capacity: 4 }, now, [0, 1])).toBeTypeOf("string");
    applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0, 1]);
    applyRoomAction(room, 0, { type: "capacity", capacity: 4 }, now, [0, 1]);
    expect(room.members.every((m) => !m.ready)).toBe(true);
    expect(room.disconnectedAt).toHaveLength(4);
    expect(roomView(room, 0, [0, 1], now).state.players).toHaveLength(4);
    room.members.push(member(2, "Chloé"));
    expect(applyRoomAction(room, 0, { type: "capacity", capacity: 2 }, now, [0, 1, 2])).toBeTypeOf("string");
    expect(room.capacity).toBe(4);
  });
  it.each([3, 4] as const)("attend les %i joueurs prévus, connectés et prêts", (capacity) => {
    const room = lobby(capacity);
    const ids = room.members.map((m) => m.id);
    for (const id of ids.slice(0, -1)) applyRoomAction(room, id, { type: "ready", ready: true }, now, ids);
    expect(room.race).toBeNull();
    const last = ids.at(-1)!;
    applyRoomAction(room, last, { type: "ready", ready: true }, now, ids.slice(0, -1));
    expect(room.race).toBeNull();
    applyRoomAction(room, last, { type: "ready", ready: true }, now, ids);
    expect(room.race!.players).toHaveLength(capacity);
    expect(applyRoomAction(room, 0, { type: "capacity", capacity: 2 }, now, ids)).toBeTypeOf("string");
    const views = ids.map((id) => roomView(room, id, ids, now + 4000));
    views.forEach((view) => expect(view.question).toEqual(views[0].question));
    const question = room.race!.sequence[0];
    applyRoomAction(room, last, { type: "answer", actionId: crypto.randomUUID(), raceId: room.raceId!,
      operationId: 0, value: String(answer(question)) }, room.startsAt! + 1000, ids);
    expect(room.race!.players[last].correct).toBe(1);
    expect(room.race!.players[0].correct).toBe(0);
    advanceRoom(room, room.startsAt! + 70000);
    expect(room.race!.winner).toBe(last);
    expect(room.race!.winners).toEqual([last]);
    const previousId = room.raceId;
    for (const id of ids.slice(0, -1)) applyRoomAction(room, id, { type: "rematch", ready: true }, now + 80000, ids);
    expect(room.raceId).toBe(previousId);
    applyRoomAction(room, last, { type: "rematch", ready: true }, now + 80000, ids);
    expect(room.raceId).not.toBe(previousId);
    expect(room.race!.players).toHaveLength(capacity);
  });
  it("conserve la course entre les autres pilotes après un abandon", () => {
    const room = started(4), start = room.startsAt!;
    connectionChanged(room, 3, false, start + 1000);
    advanceRoom(room, start + 22000);
    expect(room.race!.winner).toBeNull();
    const abandoned = room.race!.players[3];
    expect(abandoned.eliminatedAt).toBe(21000);
    const distance = abandoned.distance;
    advanceRoom(room, start + 30000);
    expect(abandoned.distance).toBe(distance);
    expect(room.race!.players[0].distance).toBeGreaterThan(distance);
    connectionChanged(room, 3, true, start + 31000);
    expect(roomView(room, 3, [0, 1, 2, 3], start + 31000).question).toBeNull();
    applyRoomAction(room, 3, { type: "answer", actionId: crypto.randomUUID(), raceId: room.raceId!,
      operationId: 0, value: String(answer(room.race!.sequence[0])) }, start + 32000, [0, 1, 2, 3]);
    expect(abandoned.correct).toBe(0);
    advanceRoom(room, start + 70000);
    expect(room.race!.winners).toEqual([0, 1, 2]);
    expect(room.reason).toBe("finish");
  });
  it("déclare le dernier pilote connecté vainqueur après trois abandons", () => {
    const room = started(4), start = room.startsAt!;
    for (const id of [0, 1, 2] as const) connectionChanged(room, id, false, start + 1000 + id * 100);
    advanceRoom(room, start + 25000);
    expect(room.race!.winner).toBe(3);
    expect(room.race!.winners).toEqual([3]);
    expect(room.reason).toBe("forfeit");
  });
  it("attribue la victoire au dernier pilote s’il revient avant sa propre échéance", () => {
    const room = started(4), start = room.startsAt!;
    for (const id of [0, 1, 2] as const) connectionChanged(room, id, false, start + 1000 + id * 100);
    connectionChanged(room, 3, false, start + 2000);
    advanceRoom(room, start + 21500);
    expect(room.race!.winner).toBeNull();
    connectionChanged(room, 3, true, start + 21750);
    expect(room.race!.winner).toBe(3);
    expect(room.reason).toBe("forfeit");
  });
  it("interrompt sans gagnant si les quatre pilotes dépassent leur délai", () => {
    const room = started(4), start = room.startsAt!;
    for (const id of [0, 1, 2, 3] as const) connectionChanged(room, id, false, start + 1000 + id * 100);
    advanceRoom(room, start + 25000);
    expect(room.race!.winner).toBe(-1);
    expect(room.race!.winners).toEqual([]);
    expect(room.reason).toBe("interrupted");
  });
  it("annule le départ commun si le quatrième joueur se déconnecte avant le feu vert", () => {
    const room = started(4);
    connectionChanged(room, 3, false, now + 500);
    expect(room.race).toBeNull();
    expect(room.members.every((m) => !m.ready)).toBe(true);
  });
});
