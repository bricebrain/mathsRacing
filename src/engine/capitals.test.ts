import { describe, expect, it } from "vitest";
import { EUROPE_CAPITALS } from "../constants/europeCapitals";
import { capitalAnswer, makeCapitalSequence } from "./capitals";
import { DIFFICULTIES } from "./config";
import { advance, createRace, skipOperation, submit } from "./race";

describe("course des capitales d’Europe", () => {
  it("couvre le périmètre complet, sans doublons, et les difficultés demandées", () => {
    expect(EUROPE_CAPITALS).toHaveLength(51);
    expect(new Set(EUROPE_CAPITALS.map((c) => c.id)).size).toBe(51);
    expect(new Set(EUROPE_CAPITALS.map((c) => c.capital)).size).toBe(51);
    for (const id of ["GB", "CH", "NO", "RU", "TR", "KZ", "GE", "AM", "AZ", "XK", "VA"])
      expect(EUROPE_CAPITALS.some((c) => c.id === id)).toBe(true);
    expect(EUROPE_CAPITALS.find((c) => c.id === "FR"))
      .toMatchObject({ capital: "Paris", difficulty: "veryEasy" });
    expect(EUROPE_CAPITALS.find((c) => c.id === "AZ"))
      .toMatchObject({ capital: "Bakou", difficulty: "hard" });
  });
  it("reproduit les mêmes pays, choix et positions, couvre chaque pays avant répétition", () => {
    expect(makeCapitalSequence(57)).toEqual(makeCapitalSequence(57));
    expect(makeCapitalSequence(57)).not.toEqual(makeCapitalSequence(58));
    const sequence = makeCapitalSequence(41, 102);
    for (const offset of [0, 51])
      expect(new Set(sequence.slice(offset, offset + 51).map((q) => q.countryId)).size).toBe(51);
    const positions = new Set<number>();
    sequence.forEach((question, index) => {
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices).size).toBe(4);
      const correct = capitalAnswer(question);
      expect(correct).toBeGreaterThanOrEqual(0);
      expect(question.choices[correct]).toBe(EUROPE_CAPITALS.find((c) => c.id === question.countryId)?.capital);
      positions.add(correct);
      if (index) expect(question.countryId).not.toBe(sequence[index - 1].countryId);
    });
    expect(positions.size).toBe(4);
  });
  it("valide seulement les quatre choix et impose deux secondes de correction", () => {
    const state = createRace(42, "capitals");
    const question = makeCapitalSequence(42)[0];
    const correct = capitalAnswer(question);
    for (const invalid of ["4", "-1", "00", "Paris", "999"])
      expect(submit(state, 0, invalid, 0, 1000)).toBe("ignored");
    expect(state.players[0].errors).toBe(0);
    expect(submit(state, 0, String((correct + 1) % 4), 0, 1000)).toBe("wrong");
    expect(state.players[0].index).toBe(0);
    expect(state.players[0].boost).toBe(0);
    expect(submit(state, 0, String(correct), 0, 1100)).toBe("ignored");
    expect(submit(state, 0, String(correct), 0, 1400)).toBe("ignored");
    expect(state.players[0].correctionUntil).toBe(3000);
    expect(skipOperation(state, 0, 0, 2000)).toBe(false);
    advance(state, 2999);
    expect(state.players[0].index).toBe(0);
    advance(state, 3000);
    expect(state.players[0].index).toBe(1);
    expect(state.players[0].boost).toBe(0);
    const next = makeCapitalSequence(42)[1];
    expect(submit(state, 0, String(capitalAnswer(next)), 1, 3400)).toBe("correct");
    expect(state.players[0].boost).toBe(DIFFICULTIES[next.difficulty].boost);
    expect(state.players[0].reviewIds).toEqual([0]);
    expect(submit(state, 0, String(correct), 0, 3800)).toBe("ignored");
    expect(state.players[1].index).toBe(0);
  });
  it("conserve le passage à huit secondes et l’équité des distances", () => {
    const state = createRace(42, "capitals");
    expect(skipOperation(state, 0, 0, 7999)).toBe(false);
    for (const index of [0, 1]) expect(skipOperation(state, index, 0, 8000)).toBe(true);
    advance(state, 10000);
    expect(state.players[0]).toEqual(state.players[1]);
    expect(state.players[0].boost).toBe(0);
  });
});
