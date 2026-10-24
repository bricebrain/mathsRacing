import { EUROPE_CAPITALS, type CountryCapital } from "../constants/europeCapitals";
import { WORLD_COUNTRIES } from "../constants/worldCountries";
import type { Difficulty } from "./math";
import { drawCycle, seededRandom, shuffle } from "./random";
export interface CapitalQuestion {
  id: number;
  kind: "capital";
  countryId: string;
  country: string;
  prompt?: string;
  choices: string[];
  difficulty: Difficulty;
}
export function makeCapitalSequence(
  seed: number, length = 512, countries: readonly CountryCapital[] = EUROPE_CAPITALS,
): CapitalQuestion[] {
  const random = seededRandom(seed);
  const draw = drawCycle(countries, random);
  return Array.from({ length }, (_, id) => {
    const entry = draw();
    const alternatives = shuffle([...new Set(countries
      .map((c) => c.capital).filter((capital) => capital !== entry.capital))], random).slice(0, 3);
    return {
      id, kind: "capital", countryId: entry.id, country: entry.country,
      prompt: entry.prompt,
      choices: shuffle([entry.capital, ...alternatives], random), difficulty: entry.difficulty,
    };
  });
}
export function capitalAnswer(question: CapitalQuestion): number {
  const capital = WORLD_COUNTRIES.find((c) => c.id === question.countryId)?.capital;
  return question.choices.findIndex((choice) => choice === capital);
}
