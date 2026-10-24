import { describe, expect, it } from "vitest";
import { answer, classify, makeSequence } from "./math";
import { advance, boostAt, createRace, submit } from "./race";
import { RACE, TOTAL_DISTANCE } from "./config";
describe("opérations et équité", () => {
  it("reproduit une séquence commune, longue, équilibrée et sans répétition immédiate", () => {
    expect(makeSequence(57)).toEqual(makeSequence(57));
    const sequence = makeSequence(41, 900);
    for (const operator of ["+", "−", "×"])
      expect(sequence.filter((o) => o.operator === operator)).toHaveLength(300);
    sequence.forEach((op, i) => {
      expect(answer(op)).toBeGreaterThanOrEqual(0);
      if (op.operator === "×") {
        expect(op.a).toBeGreaterThanOrEqual(1);
        expect(op.a).toBeLessThanOrEqual(10);
        expect(op.b).toBeGreaterThanOrEqual(1);
        expect(op.b).toBeLessThanOrEqual(10);
      }
      if (i)
        expect(`${op.a}${op.operator}${op.b}`).not.toBe(
          `${sequence[i - 1].a}${sequence[i - 1].operator}${sequence[i - 1].b}`,
        );
    });
  });
  it("classifie les exemples attendus et les tables familières", () => {
    expect(classify(1, 1, "+")).toBe("veryEasy");
    expect(classify(7, 5, "+")).toBe("easy");
    expect(classify(43, 18, "−")).toBe("medium");
    expect(classify(9, 8, "×")).toBe("hard");
    expect(classify(9, 10, "×")).toBe("veryEasy");
    expect(classify(5, 8, "×")).toBe("easy");
  });
  it("valide les trois opérateurs", () => {
    expect(
      answer({ id: 0, a: 7, b: 9, operator: "+", difficulty: "easy" }),
    ).toBe(16);
    expect(
      answer({ id: 0, a: 43, b: 18, operator: "−", difficulty: "medium" }),
    ).toBe(25);
    expect(
      answer({ id: 0, a: 9, b: 8, operator: "×", difficulty: "hard" }),
    ).toBe(72);
  });
  it("permet la progression indépendante et rejette les doubles validations", () => {
    const state = createRace(5),
      op = state.sequence[0];
    expect(submit(state, 0, String(answer(op)), op.id, 1000)).toBe("correct");
    expect(state.players[0].index).toBe(1);
    expect(state.players[1].index).toBe(0);
    expect(submit(state, 0, String(answer(op)), op.id, 1400)).toBe("ignored");
  });
  it("garde la question et le boost existant après une erreur, limite les tentatives", () => {
    const state = createRace(5),
      op = state.sequence[0];
    submit(state, 0, String(answer(op)), 0, 1000);
    expect(submit(state, 0, "999", 1, 1400)).toBe("wrong");
    expect(state.players[0].index).toBe(1);
    expect(state.players[0].errors).toBe(1);
    expect(boostAt(state.players[0], 1400)).toBeGreaterThan(0);
    expect(submit(state, 0, "999", 1, 1450)).toBe("ignored");
  });
});
describe("simulation indépendante du rendu", () => {
  it("avance les deux voitures sans réponse, à vitesse égale", () => {
    const state = createRace(1);
    advance(state, 10000);
    expect(state.players[0].distance).toBe(520);
    expect(state.players[1].distance).toBe(520);
  });
  it("remplace le boost et réinitialise sa durée sans addition", () => {
    const state = createRace(3);
    for (const time of [1000, 1600]) {
      const op = state.sequence[state.players[0].index];
      submit(state, 0, String(answer(op)), op.id, time);
    }
    const p = state.players[0];
    expect(p.boostAt).toBe(1600);
    expect(boostAt(p, 4600)).toBe(p.boost);
    expect(boostAt(p, 4925)).toBeCloseTo(p.boost / 2);
    expect(boostAt(p, 5250)).toBe(0);
  });
  it("donne exactement la même distance à réponses et timings égaux", () => {
    const state = createRace(7);
    for (const time of [1000, 2300, 4300, 7000]) {
      for (const i of [0, 1]) {
        const op = state.sequence[state.players[i].index];
        submit(state, i, String(answer(op)), op.id, time);
      }
    }
    advance(state, 12000);
    expect(state.players[0]).toEqual(state.players[1]);
  });
  it("intègre le boost sans dépendre de la fréquence des frames", () => {
    const coarse = createRace(4),
      fine = createRace(4);
    for (const s of [coarse, fine])
      submit(s, 0, String(answer(s.sequence[0])), 0, 1000);
    advance(coarse, 12000);
    for (let t = 1010; t <= 12000; t += 10) advance(fine, t);
    expect(coarse.players[0].distance).toBeCloseTo(fine.players[0].distance, 8);
  });
  it("détecte la ligne exacte, le gagnant et une égalité sans favoriser un index", () => {
    const state = createRace(5);
    advance(state, 70000);
    expect(state.winner).toBe(-1);
    expect(state.players[0].distance).toBe(TOTAL_DISTANCE);
    expect(state.players[0].finishedAt).toBeCloseTo(
      (TOTAL_DISTANCE / RACE.baseSpeed) * 1000,
      2,
    );
    const boosted = createRace(5);
    submit(boosted, 1, String(answer(boosted.sequence[0])), 0, 1000);
    advance(boosted, 70000);
    expect(boosted.winner).toBe(1);
    expect(submit(boosted, 0, "1", 0, 71000)).toBe("ignored");
  });
});
