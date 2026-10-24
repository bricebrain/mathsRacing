import { EUROPE_CAPITALS } from "../constants/europeCapitals";
import type { Difficulty } from "./math";
export interface CapitalQuestion {
  id: number;
  kind: "capital";
  countryId: string;
  country: string;
  choices: string[];
  difficulty: Difficulty;
}
export function makeCapitalSequence(seed: number, length = 512): CapitalQuestion[] {
  let state = seed >>> 0;
  const random = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 4294967296) * max);
  };
  const shuffle = <T,>(values: readonly T[]): T[] => {
    const items = [...values];
    for (let i = items.length - 1; i > 0; i--) {
      const j = random(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const questions: CapitalQuestion[] = [];
  let bag: typeof EUROPE_CAPITALS[number][] = [];
  for (let id = 0; id < length; id++) {
    if (!bag.length) {
      bag = shuffle(EUROPE_CAPITALS);
      if (bag.at(-1)?.id === questions.at(-1)?.countryId)
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    const entry = bag.pop()!;
    const alternatives = shuffle(EUROPE_CAPITALS.filter((c) => c.id !== entry.id))
      .slice(0, 3).map((c) => c.capital);
    questions.push({
      id, kind: "capital", countryId: entry.id, country: entry.country,
      choices: shuffle([entry.capital, ...alternatives]), difficulty: entry.difficulty,
    });
  }
  return questions;
}
export function capitalAnswer(question: CapitalQuestion): number {
  const capital = EUROPE_CAPITALS.find((c) => c.id === question.countryId)?.capital;
  return question.choices.findIndex((choice) => choice === capital);
}
