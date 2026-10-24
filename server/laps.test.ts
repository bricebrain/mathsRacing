import { describe, expect, it } from "vitest";
import { applyRoomAction, advanceRoom } from "./match";
import { makeRoom, member } from "./model";
import { roomView } from "./view";
import { actionSchema } from "./validation";
const now = 100000;
function lobby() {
  const room = makeRoom("ABC234", "Alice", now);
  room.members.push(member(1, "Bob"));
  return room;
}
describe("nombre de tours partagé", () => {
  it("garde 3 tours par défaut et limite les choix à 3, 5 ou 10", () => {
    const room = lobby();
    expect(roomView(room, 0, [0, 1], now).state.laps).toBe(3);
    for (const laps of [3, 5, 10])
      expect(actionSchema.safeParse({ type: "laps", laps }).success).toBe(true);
    for (const laps of [0, 4, 5.5, 11, "5", null])
      expect(actionSchema.safeParse({ type: "laps", laps }).success).toBe(false);
  });
  it("réserve le choix au créateur et demande un nouvel accord après changement", () => {
    const room = lobby();
    expect(applyRoomAction(room, 1, { type: "laps", laps: 5 }, now, [0, 1])).toBeTypeOf("string");
    expect(room.laps).toBe(3);
    applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0, 1]);
    applyRoomAction(room, 0, { type: "laps", laps: 3 }, now, [0, 1]);
    expect(room.members[1].ready).toBe(true);
    applyRoomAction(room, 0, { type: "laps", laps: 10 }, now, [0, 1]);
    expect(room.members.every((m) => !m.ready)).toBe(true);
    expect(roomView(room, 1, [0, 1], now).state.laps).toBe(10);
  });
  it.each([5, 10] as const)("conserve %i tours au départ, à la restauration et à la revanche", (laps) => {
    const room = lobby();
    applyRoomAction(room, 0, { type: "laps", laps }, now, [0, 1]);
    for (const id of [0, 1] as const)
      applyRoomAction(room, id, { type: "ready", ready: true }, now, [0, 1]);
    expect(room.race!.laps).toBe(laps);
    expect(applyRoomAction(room, 0, { type: "laps", laps: 3 }, now, [0, 1])).toBeTypeOf("string");
    const restored = JSON.parse(JSON.stringify(room));
    expect(roomView(restored, 1, [0, 1], now + 4000).state.laps).toBe(laps);
    advanceRoom(restored, restored.startsAt + 65000);
    expect(restored.race.winner).toBeNull();
    advanceRoom(restored, restored.startsAt + 250000);
    expect(restored.race.players[0].distance).toBe(1050 * laps);
    for (const id of [0, 1] as const)
      applyRoomAction(restored, id, { type: "rematch", ready: true }, now + 300000, [0, 1]);
    expect(restored.race.laps).toBe(laps);
    expect(restored.race.players[0].distance).toBe(0);
  });
});
