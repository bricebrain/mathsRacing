import { describe, expect, it } from "vitest";
import { makeRoom, member } from "./model";
import { advanceRoom, applyRoomAction } from "./match";
import { roomView } from "./view";
import { answer, answerLabel } from "../src/engine/questions";
import { actionSchema } from "./validation";
const now = 100000;
const mode = { type: "mode", mode: "capitals" } as const;
function lobby() {
  const room = makeRoom("ABC234", "Alice", now);
  room.members.push(member(1, "Bob"));
  return room;
}
function started() {
  const room = lobby();
  applyRoomAction(room, 0, mode, now, [0, 1]);
  for (const id of [0, 1] as const)
    applyRoomAction(room, id, { type: "ready", ready: true }, now, [0, 1]);
  return room;
}
describe("mode partagé de la salle", () => {
  it("autorise seulement le créateur à changer de mode et annule les accords précédents", () => {
    const room = lobby();
    expect(applyRoomAction(room, 1, mode, now, [0, 1])).toBeTypeOf("string");
    expect(room.mode).toBe("math");
    applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0, 1]);
    applyRoomAction(room, 0, mode, now, [0, 1]);
    expect(room.members.every((m) => !m.ready)).toBe(true);
    expect(roomView(room, 1, [0, 1], now).mode).toBe("capitals");
    expect(actionSchema.safeParse(mode).success).toBe(true);
    expect(actionSchema.safeParse({ ...mode, mode: "unknown" }).success).toBe(false);
  });
  it("fixe le mode au départ et conserve les questions après restauration", () => {
    const room = started();
    expect(applyRoomAction(room, 0, { type: "mode", mode: "math" }, now, [0, 1])).toBeTypeOf("string");
    const restored = JSON.parse(JSON.stringify(room));
    const at = room.startsAt! + 1000;
    const view = roomView(restored, 0, [0, 1], at);
    expect(view.mode).toBe("capitals");
    expect(view.question).toEqual(roomView(room, 1, [0, 1], at).question);
    expect(view.question).not.toHaveProperty("answer");
    expect(view.review).toEqual([]);
  });
  it("valide et corrige côté serveur, conserve le mode lors de la revanche", () => {
    const room = started(), question = room.race!.sequence[0];
    const action = { type: "answer", actionId: crypto.randomUUID(), raceId: room.raceId!,
      operationId: 0, value: String((answer(question) + 1) % 4) } as const;
    applyRoomAction(room, 0, action, room.startsAt! + 1000, [0, 1]);
    expect(roomView(room, 0, [0, 1], now + 5000).review).toEqual([]);
    applyRoomAction(room, 0, { ...action, actionId: crypto.randomUUID(), value: String(answer(question)) },
      room.startsAt! + 1500, [0, 1]);
    expect(room.race!.players[0].correct).toBe(1);
    advanceRoom(room, room.startsAt! + 70000);
    expect(roomView(room, 0, [0, 1], now + 80000).review[0].answer).toBe(answerLabel(question));
    expect(roomView(room, 1, [0, 1], now + 80000).review).toEqual([]);
    for (const id of [0, 1] as const)
      applyRoomAction(room, id, { type: "rematch", ready: true }, now + 80000, [0, 1]);
    expect(room.race!.sequence[0]).toHaveProperty("kind", "capital");
  });
});
