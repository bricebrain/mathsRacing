import { describe, expect, it } from "vitest";
import {
  advance,
  boostAt,
  createRace,
  skipOperation,
  skipRemaining,
  submit,
} from "./race";
import { answer } from "./questions";
import { RACE } from "./config";
describe("Passer un calcul sans avantage de vitesse", () => {
  it("bloque avant huit secondes et accepte exactement à la limite", () => {
    const state = createRace(20);
    expect(skipRemaining(state.players[0], 0)).toBe(8000);
    expect(skipOperation(state, 0, 0, 7999)).toBe(false);
    expect(skipOperation(state, 0, 0, 8000)).toBe(true);
    expect(state.players[0].skipped).toBe(1);
    expect(state.players[0].correct).toBe(0);
    expect(state.players[0].errors).toBe(0);
    expect(state.players[0].index).toBe(1);
    expect(state.players[1].index).toBe(0);
  });
  it("ne donne aucun boost, conserve la distance et rejette un double passage", () => {
    const state = createRace(20),
      control = createRace(20);
    skipOperation(state, 0, 0, 8000);
    advance(control, 8000);
    expect(state.players[0].distance).toBe(control.players[0].distance);
    expect(boostAt(state.players[0], 8000)).toBe(0);
    expect(skipOperation(state, 0, 0, 8100)).toBe(false);
    expect(skipOperation(state, 0, 1, 16000)).toBe(true);
    expect(state.players[0].skipped).toBe(2);
  });
  it("relance le délai à chaque nouvelle opération, y compris après une bonne réponse", () => {
    const state = createRace(9);
    submit(state, 0, String(answer(state.sequence[0])), 0, 5000);
    expect(skipOperation(state, 0, 1, 8000)).toBe(false);
    expect(skipOperation(state, 0, 1, 5000 + RACE.skipDelay)).toBe(true);
    expect(state.players[0].correct).toBe(1);
    expect(state.players[0].skipped).toBe(1);
  });
  it("ne transforme pas les calculs passés en bonnes réponses ou en boosts", () => {
    const state = createRace(20);
    skipOperation(state, 0, 0, 8000);
    submit(state, 0, String(answer(state.sequence[1])), 1, 8500);
    expect(state.players[0].index).toBe(2);
    expect(state.players[0].correct).toBe(1);
    expect(state.players[0].skipped).toBe(1);
    expect(boostAt(state.players[0], 8500)).toBeGreaterThan(0);
  });
  it("collecte les calculs à revoir sans doublons après erreurs puis passage", () => {
    const state = createRace(20);
    submit(state, 0, "999", 0, 1000);
    submit(state, 0, "999", 0, 1500);
    skipOperation(state, 0, 0, 8000);
    expect(state.players[0].reviewIds).toEqual([0]);
    expect(state.players[0].errors).toBe(2);
  });
  it("offre les mêmes règles aux deux joueurs et interdit le passage après arrivée", () => {
    const state = createRace(20);
    for (const index of [0, 1]) skipOperation(state, index, 0, 8000);
    expect(state.players[0]).toEqual(state.players[1]);
    advance(state, 70000);
    expect(skipOperation(state, 0, 1, 71000)).toBe(false);
  });
});

it("fige les positions au premier franchissement même après une longue interruption", () => {
  const state = createRace(5);
  submit(state, 1, String(answer(state.sequence[0])), 0, 1000);
  advance(state, 70000);
  expect(state.winner).toBe(1);
  expect(state.time).toBeCloseTo(state.players[1].finishedAt!, 6);
  expect(state.players[0].finishedAt).toBeNull();
  expect(state.players[0].distance).toBeLessThan(3150);
  const distance = state.players[0].distance;
  advance(state, 80000);
  expect(state.players[0].distance).toBe(distance);
});
