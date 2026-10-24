import { describe, expect, it } from "vitest";
import { advance, createRace, submit } from "../engine/race";
import { answer } from "../engine/questions";
import { emptyRace } from "./display";
import { perspective, playerOrder, raceRank, rankedIndices } from "./ranking";
import { laneOffset } from "../game/lanes";
import type { PlayerId } from "./protocol";
describe("positions et perspectives de quatre pilotes", () => {
  it("garde une voie unique et stable pour chaque identité sur tous les écrans", () => {
    for (const count of [2, 3, 4]) {
      const ids = Array.from({ length: count }, (_, index) => index as PlayerId);
      expect(new Set(ids.map((id) => laneOffset(id, count))).size).toBe(count);
      for (const selfId of ids) {
        const order = playerOrder(count, selfId);
        expect(order[0]).toBe(selfId);
        expect(new Set(order).size).toBe(count);
        order.forEach((id) => expect(laneOffset(id, count)).toBe(laneOffset(ids[id], count)));
      }
    }
  });
  it("place le joueur local en premier et traduit tous les gagnants sans perdre les autres", () => {
    const state = emptyRace(3, 4);
    state.players.forEach((player, id) => { player.distance = id * 100; });
    state.winner = 3;
    state.winners = [3];
    const local = perspective(state, 2);
    expect(local.players.map((p) => p.distance)).toEqual([200, 0, 100, 300]);
    expect(local.winner).toBe(3);
    expect(local.winners).toEqual([3]);
    expect(perspective(state, 3).winners).toEqual([0]);
    state.winner = -1;
    state.winners = [1, 3];
    expect(perspective(state, 3).winners).toEqual([2, 0]);
  });
  it("classe les abandons derrière les joueurs actifs et le vainqueur par abandon en tête", () => {
    const state = emptyRace(3, 4);
    state.players.forEach((player, id) => { player.distance = 400 - id * 100; });
    state.players[0].eliminatedAt = 1000;
    expect(rankedIndices(state)).toEqual([1, 2, 3, 0]);
    expect(raceRank(state, 0)).toBe(4);
    state.winners = [3];
    state.winner = 3;
    expect(rankedIndices(state)[0]).toBe(3);
    expect(raceRank(state, 3)).toBe(1);
  });
  it("ne déclare pas tous les pilotes gagnants lorsqu’il n’y a que deux premiers ex æquo", () => {
    const state = createRace(5, "math", 3, 4);
    for (const id of [1, 3]) submit(state, id, String(answer(state.sequence[0])), 0, 1000);
    advance(state, 70000);
    expect(state.winner).toBe(-1);
    expect(state.winners).toEqual([1, 3]);
    expect(state.players.filter((p) => p.finishedAt !== null)).toHaveLength(2);
    expect(raceRank(state, 1)).toBe(1);
    expect(raceRank(state, 3)).toBe(1);
    expect(raceRank(state, 0)).toBe(3);
  });
});
