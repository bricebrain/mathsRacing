import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CULTURE_QUESTIONS } from "../constants/cultureQuestions";
import { WORLD_COUNTRIES } from "../constants/worldCountries";
import { THEME_IDS } from "../constants/themes";
import { makeQuestionSequence } from "./sequences";
import { answer, answerLabel, isChoice, isCapital } from "./questions";
import { advance, createRace, skipOperation, submit } from "./race";
const signature = (question: ReturnType<typeof makeQuestionSequence>[number]) =>
  isCapital(question) ? `capital:${question.countryId}`
    : isChoice(question) ? `${question.theme}:${question.entryId}` : "math";

describe("catalogues et mélange des thèmes", () => {
  it("fournit 196 pays avec un drapeau SVG local et 120 questions de culture", () => {
    expect(WORLD_COUNTRIES).toHaveLength(196);
    expect(JSON.parse(readFileSync("public/data/world-countries.json", "utf8")))
      .toEqual(JSON.parse(JSON.stringify(WORLD_COUNTRIES)));
    expect(new Set(WORLD_COUNTRIES.map((c) => c.id)).size).toBe(196);
    for (const country of WORLD_COUNTRIES) {
      expect(country.capital.length).toBeGreaterThan(0);
      expect(existsSync(`public/flags/${country.id.toLowerCase()}.svg`)).toBe(true);
    }
    expect(CULTURE_QUESTIONS).toHaveLength(120);
    expect(new Set(CULTURE_QUESTIONS.map((q) => q.prompt)).size).toBe(120);
    for (const difficulty of ["veryEasy", "easy", "medium", "hard"])
      expect(CULTURE_QUESTIONS.filter((q) => q.difficulty === difficulty)).toHaveLength(30);
    for (const entry of CULTURE_QUESTIONS) expect(new Set(entry.choices).size).toBe(4);
    expect(WORLD_COUNTRIES.find((c) => c.id === "GQ")?.capital).toBe("Ciudad de la Paz");
    expect(WORLD_COUNTRIES.find((c) => c.id === "LK")?.capital).toBe("Sri Jayawardenepura Kotte");
    expect(WORLD_COUNTRIES.find((c) => c.id === "ZA")?.prompt).toContain("administrative");
  });
  it.each(THEME_IDS)("génère des questions valides et reproductibles pour %s", (theme) => {
    const sequence = makeQuestionSequence(42, 210, [theme]);
    expect(sequence).toEqual(makeQuestionSequence(42, 210, [theme]));
    expect(sequence).not.toEqual(makeQuestionSequence(43, 210, [theme]));
    sequence.forEach((question, id) => {
      expect(question.id).toBe(id);
      expect(answer(question)).toBeGreaterThanOrEqual(0);
      expect(answerLabel(question)).toBeTruthy();
      if (isChoice(question)) {
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(answer(question)).toBeLessThan(4);
        expect(question).not.toHaveProperty("answer");
      }
    });
    if (theme !== "math") {
      const cycle = theme === "capitals" ? 51 : theme === "culture" ? 120 : 196;
      expect(new Set(sequence.slice(0, cycle).map(signature)).size).toBe(cycle);
    }
  });
  it("répartit les thèmes également et normalise leur ordre pour les deux joueurs", () => {
    const sequence = makeQuestionSequence(45, 100, THEME_IDS);
    expect(sequence).toEqual(makeQuestionSequence(45, 100, [...THEME_IDS].reverse()));
    for (let offset = 0; offset < 100; offset += 5) {
      const block = sequence.slice(offset, offset + 5);
      expect(block.filter(isCapital)).toHaveLength(2);
      expect(block.filter((q) => !isChoice(q))).toHaveLength(1);
      expect(block.filter((q) => isChoice(q) && !isCapital(q) && q.theme === "culture")).toHaveLength(1);
      expect(block.filter((q) => isChoice(q) && !isCapital(q) && q.theme === "flags")).toHaveLength(1);
    }
    expect(() => makeQuestionSequence(1, 10, [])).toThrow();
  });
});

describe("correction de deux secondes", () => {
  it.each(THEME_IDS)("empêche les essais multiples pour %s et avance sans turbo", (theme) => {
    const state = createRace(5, theme);
    const question = state.sequence[0];
    const wrong = isChoice(question) ? String((answer(question) + 1) % 4) : "999";
    expect(submit(state, 0, wrong, 0, 1000)).toBe("wrong");
    for (const time of [1001, 1300, 2000, 2999]) {
      expect(submit(state, 0, String(answer(question)), 0, time)).toBe("ignored");
      expect(skipOperation(state, 0, 0, time)).toBe(false);
    }
    expect(state.players[0].errors).toBe(1);
    expect(state.players[0].correct).toBe(0);
    expect(state.players[0].index).toBe(0);
    const restored = JSON.parse(JSON.stringify(state));
    advance(restored, 3000);
    expect(restored.players[0].index).toBe(1);
    expect(restored.players[0].questionAt).toBe(3000);
    expect(restored.players[0].boost).toBe(0);
    expect(restored.players[0].correctionUntil).toBeNull();
    expect(restored.players[1].index).toBe(0);
    expect(submit(restored, 0, String(answer(question)), 0, 3100)).toBe("ignored");
    const next = restored.sequence[1];
    expect(submit(restored, 0, String(answer(next)), 1, 3400)).toBe("correct");
    expect(restored.players[0].correct).toBe(1);
    expect(skipOperation(restored, 0, 2, 10000)).toBe(false);
  });
  it("fige la correction si la course se termine avant sa fin", () => {
    const state = createRace(5);
    submit(state, 0, "999", 0, 60000);
    advance(state, 70000);
    expect(state.winner).toBe(-1);
    expect(state.players[0].index).toBe(0);
    expect(state.players[0].correctionUntil).toBe(62000);
  });
});
