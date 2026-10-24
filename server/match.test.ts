import { describe, expect, it } from "vitest";
import { makeRoom, member } from "./model";
import { advanceRoom, applyRoomAction, connectionChanged } from "./match";
import { roomView } from "./view";
import { answer } from "../src/engine/questions";
import { NETWORK, type ClientAction } from "../src/shared/protocol";
const now = 100000;
function started() {
  const room = makeRoom("ABC234", "Alice", now);
  room.members.push(member(1, "Bob"));
  applyRoomAction(room, 0, { type: "ready", ready: true }, now, [0, 1]);
  applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0, 1]);
  return room;
}
function response(
  room: ReturnType<typeof started>,
  player = 0,
): Extract<ClientAction, { type: "answer" }> {
  const operation = room.race!.sequence[room.race!.players[player].index];
  return {
    type: "answer",
    actionId: crypto.randomUUID(),
    raceId: room.raceId!,
    operationId: operation.id,
    value: String(answer(operation)),
  };
}
describe("salle multijoueur faisant autorité", () => {
  it("attend deux joueurs connectés et prêts avant un départ commun", () => {
    const room = makeRoom("ABC234", "Alice", now);
    applyRoomAction(room, 0, { type: "ready", ready: true }, now, [0]);
    expect(room.race).toBeNull();
    room.members.push(member(1, "Bob"));
    applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0]);
    expect(room.race).toBeNull();
    applyRoomAction(room, 1, { type: "ready", ready: true }, now, [0, 1]);
    expect(room.startsAt).toBe(now + 3000);
    expect(roomView(room, 0, [0, 1], now).phase).toBe("countdown");
    expect(roomView(room, 0, [0, 1], now).question).toBeNull();
  });
  it("ne révèle ni jetons, ni séquence, ni corrections en cours de course", () => {
    const room = started(),
      view = roomView(room, 0, [0, 1], room.startsAt! + 1);
    expect(view.question).toEqual(room.race!.sequence[0]);
    expect(JSON.stringify(view)).not.toContain("token");
    expect(JSON.stringify(view)).not.toContain("sequence");
    expect(JSON.stringify(view)).not.toContain("lastAttempt");
    expect(view.review).toEqual([]);
  });
  it("valide côté serveur, ignore les actions précoces, anciennes et dupliquées", () => {
    const room = started(),
      action = response(room);
    applyRoomAction(
      room,
      0,
      { ...action, actionId: crypto.randomUUID() },
      now,
      [0, 1],
    );
    expect(room.race!.players[0].correct).toBe(0);
    const at = room.startsAt! + 1000;
    const ack = applyRoomAction(room, 0, action, at, [0, 1]);
    expect(room.race!.players[0].correct).toBe(1);
    expect(applyRoomAction(room, 0, action, at + 500, [0, 1])).toEqual(ack);
    expect(room.race!.players[0].correct).toBe(1);
    applyRoomAction(
      room,
      0,
      { ...response(room), raceId: crypto.randomUUID() },
      at + 1000,
      [0, 1],
    );
    expect(room.race!.players[0].correct).toBe(1);
    expect(room.race!.players[1].correct).toBe(0);
    expect(roomView(room, 1, [0, 1], at).question).toEqual(
      room.race!.sequence[0],
    );
  });
  it("garde le même état après une sauvegarde et restauration JSON", () => {
    const room = started(),
      restored = JSON.parse(JSON.stringify(room));
    expect(restored).toEqual(room);
    advanceRoom(room, room.startsAt! + 10000);
    advanceRoom(restored, restored.startsAt + 10000);
    expect(restored.race).toEqual(room.race);
  });
  it("annule le compte à rebours si un joueur se déconnecte", () => {
    const room = started();
    connectionChanged(room, 0, false, now + 1000);
    expect(room.race).toBeNull();
    expect(room.startsAt).toBeNull();
    expect(room.members.every((m) => !m.ready)).toBe(true);
  });
  it("continue la course et restaure la progression après une coupure courte", () => {
    const room = started(),
      start = room.startsAt!;
    applyRoomAction(room, 0, response(room), start + 1000, [0, 1]);
    connectionChanged(room, 0, false, start + 2000);
    advanceRoom(room, start + 6000);
    const distance = room.race!.players[0].distance;
    connectionChanged(room, 0, true, start + 7000);
    expect(room.race!.players[0].distance).toBeGreaterThan(distance);
    expect(room.race!.players[0].correct).toBe(1);
    expect(room.disconnectedAt[0]).toBeNull();
    expect(room.race!.winner).toBeNull();
  });
  it("attribue une victoire par abandon après le délai de reconnexion", () => {
    const room = started(),
      start = room.startsAt!;
    connectionChanged(room, 1, false, start + 1000);
    advanceRoom(room, start + 1000 + NETWORK.grace);
    expect(room.race!.winner).toBe(0);
    expect(room.reason).toBe("forfeit");
    const time = room.race!.time;
    advanceRoom(room, start + 60000);
    expect(room.race!.time).toBe(time);
  });
  it("interrompt sans vainqueur si les deux sont absents", () => {
    const room = started(),
      start = room.startsAt!;
    connectionChanged(room, 0, false, start + 1000);
    connectionChanged(room, 1, false, start + 1200);
    advanceRoom(room, start + 22000);
    expect(room.race!.winner).toBe(-1);
    expect(room.reason).toBe("interrupted");
  });
  it("privilégie une arrivée antérieure à la date d’abandon", () => {
    const room = started(),
      start = room.startsAt!;
    connectionChanged(room, 0, false, start + 50000);
    advanceRoom(room, start + 80000);
    expect(room.reason).toBe("finish");
  });
  it("exige deux accords pour rejouer et invalide les actions de la course précédente", () => {
    const room = started(),
      oldId = room.raceId!,
      oldAction = response(room);
    advanceRoom(room, room.startsAt! + 70000);
    applyRoomAction(
      room,
      0,
      { type: "rematch", ready: true },
      now + 80000,
      [0, 1],
    );
    expect(room.raceId).toBe(oldId);
    applyRoomAction(
      room,
      1,
      { type: "rematch", ready: true },
      now + 80000,
      [0, 1],
    );
    expect(room.raceId).not.toBe(oldId);
    applyRoomAction(room, 0, oldAction, now + 85000, [0, 1]);
    expect(room.race!.players[0].correct).toBe(0);
  });
  it("refuse une couleur déjà prise", () => {
    const room = makeRoom("ABC234", "Alice", now);
    room.members.push(member(1, "Bob"));
    expect(
      applyRoomAction(
        room,
        0,
        { type: "color", color: room.members[1].color as "#b5ef63" },
        now,
        [0, 1],
      ),
    ).toBe("Cette couleur est déjà prise.");
  });
  it("ne révèle les corrections qu’après la course et seulement au joueur concerné", () => {
    const room = started(),
      start = room.startsAt!;
    const action = response(room);
    if (action.type !== "answer") throw Error();
    applyRoomAction(room, 0, { ...action, value: "999" }, start + 1000, [0, 1]);
    expect(roomView(room, 0, [0, 1], start + 2000).review).toEqual([]);
    advanceRoom(room, start + 70000);
    expect(roomView(room, 0, [0, 1], start + 70000).review).toHaveLength(1);
    expect(roomView(room, 1, [0, 1], start + 70000).review).toEqual([]);
  });
});
