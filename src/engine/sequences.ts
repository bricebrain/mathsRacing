import { THEME_IDS, type Theme } from "../constants/themes";
import { EUROPE_CAPITALS } from "../constants/europeCapitals";
import { WORLD_COUNTRIES } from "../constants/worldCountries";
import { makeSequence } from "./math";
import { makeCapitalSequence } from "./capitals";
import { makeQuizSequence } from "./quiz";
import type { Question } from "./questions";
import { seededRandom, shuffle } from "./random";
export function makeQuestionSequence(seed: number, length: number, selected: readonly Theme[]): Question[] {
  const themes = THEME_IDS.filter((theme) => selected.includes(theme));
  if (!themes.length) throw new Error("Choisis au moins un thème.");
  const random = seededRandom(seed);
  const europeIds = new Set(EUROPE_CAPITALS.map((country) => country.id));
  const perTheme = Math.ceil(length / themes.length);
  const generators = new Map<Theme, { sequence: Question[]; index: number }>(themes.map((theme, index) => {
    const themeSeed = (seed + Math.imul(index, 2654435761)) >>> 0;
    const countries = themes.includes("capitals")
      ? WORLD_COUNTRIES.filter((country) => !europeIds.has(country.id)) : WORLD_COUNTRIES;
    const sequence = theme === "math" ? makeSequence(themeSeed, perTheme)
      : theme === "capitals" ? makeCapitalSequence(themeSeed, perTheme)
        : theme === "worldCapitals" ? makeCapitalSequence(themeSeed, perTheme, countries)
          : makeQuizSequence(themeSeed, perTheme, theme);
    return [theme, { sequence, index: 0 }];
  }));
  let bag: Theme[] = [];
  return Array.from({ length }, (_, id) => {
    if (!bag.length) bag = shuffle(themes, random);
    const generator = generators.get(bag.pop()!)!;
    return { ...generator.sequence[generator.index++], id };
  });
}
