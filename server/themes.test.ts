import { describe, expect, it } from "vitest";
import { makeRoom, member } from "./model";
import { advanceRoom, applyRoomAction } from "./match";
import { roomView } from "./view";
import { actionSchema } from "./validation";
import { answer, answerLabel } from "../src/engine/questions";
const now = 100000;
function lobby() {
  const room = makeRoom("ABC234", "Alice", now);
  room.members.push(member(1, "Bob"));
  return room;
}
describe("thèmes multiples et corrections privées", () => {
  it("refuse les sélections vides, inconnues ou dupliquées", () => {
    for (const themes of [[], ["unknown"], ["math", "math"]])
      expect(actionSchema.safeParse({ type: "themes", themes }).success).toBe(false);
    expect(actionSchema.safeParse({ type: "themes", themes: ["flags", "culture"] }).success).toBe(true);
  });
  it("applique les cases successives sans écraser les sélections précédentes", () => {
    const room = lobby();
    for (const theme of ["capitals", "worldCapitals", "culture", "flags"] as const)
      applyRoomAction(room, 0, { type: "theme", theme, selected: true }, now, [0, 1]);
    expect(room.themes).toEqual(["math", "capitals", "worldCapitals", "culture", "flags"]);
    for (const theme of ["math", "capitals", "worldCapitals", "culture"] as const)
      applyRoomAction(room, 0, { type: "theme", theme, selected: false }, now, [0, 1]);
    expect(room.themes).toEqual(["flags"]);
    expect(applyRoomAction(room, 0, { type: "theme", theme: "flags", selected: false }, now, [0, 1]))
      .toBeTypeOf("string");
    expect(room.themes).toEqual(["flags"]);
  });
  it("réserve le choix à l’hôte, annule les accords et fige les thèmes au départ", () => {
    const room = lobby();
    const action = { type: "themes", themes: ["flags", "culture"] } as const;
    const selected = { ...action, themes: [...action.themes] };
    expect(applyRoomAction(room, 1, selected, now, [0, 1])).toBeTypeOf("string");
    applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0, 1]);
    applyRoomAction(room, 0, selected, now, [0, 1]);
    expect(room.members.every((m) => !m.ready)).toBe(true);
    expect(roomView(room, 1, [0, 1], now).themes).toEqual(["culture", "flags"]);
    for (const id of [0, 1] as const)
      applyRoomAction(room, id, { type: "ready", ready: true }, now, [0, 1]);
    expect(applyRoomAction(room, 0, { type: "themes", themes: ["math"] }, now, [0, 1])).toBeTypeOf("string");
  });
  it("n’affiche la bonne réponse qu’au joueur ayant fait l’erreur, pendant deux secondes", () => {
    const room = lobby();
    applyRoomAction(room, 0, { type: "themes", themes: ["culture", "flags"] }, now, [0, 1]);
    for (const id of [0, 1] as const)
      applyRoomAction(room, id, { type: "ready", ready: true }, now, [0, 1]);
    const start = room.startsAt!, question = room.race!.sequence[0];
    const action = { type: "answer", actionId: crypto.randomUUID(), raceId: room.raceId!,
      operationId: 0, value: String((answer(question) + 1) % 4) } as const;
    expect(roomView(room, 0, [0, 1], start + 1000).correction).toBeNull();
    applyRoomAction(room, 0, action, start + 1000, [0, 1]);
    const view = roomView(room, 0, [0, 1], start + 1000);
    expect(view.correction).toMatchObject({ answer: answerLabel(question), choice: answer(question), until: 3000 });
    expect(roomView(room, 1, [0, 1], start + 1000).correction).toBeNull();
    expect(view.review).toEqual([]);
    const restored = JSON.parse(JSON.stringify(room));
    expect(roomView(restored, 0, [0, 1], start + 1500).correction).toEqual(view.correction);
    applyRoomAction(restored, 0, { ...action, actionId: crypto.randomUUID(), value: String(answer(question)) },
      start + 2000, [0, 1]);
    expect(restored.race.players[0].errors).toBe(1);
    expect(restored.race.players[0].correct).toBe(0);
    advanceRoom(restored, start + 2999);
    expect(roomView(restored, 0, [0, 1], start + 2999).question?.id).toBe(0);
    advanceRoom(restored, start + 3000);
    expect(roomView(restored, 0, [0, 1], start + 3000).question?.id).toBe(1);
    expect(roomView(restored, 0, [0, 1], start + 3000).correction).toBeNull();
    advanceRoom(restored, start + 70000);
    for (const id of [0, 1] as const)
      applyRoomAction(restored, id, { type: "rematch", ready: true }, start + 80000, [0, 1]);
    expect(restored.themes).toEqual(["culture", "flags"]);
    expect(restored.race.players[0].correctionUntil).toBeNull();
  });
});
