import { CULTURE_QUESTIONS } from "../constants/cultureQuestions";
import { WORLD_COUNTRIES } from "../constants/worldCountries";
import type { Difficulty } from "./math";
import { drawCycle, seededRandom, shuffle } from "./random";
export interface QuizQuestion {
  id: number;
  kind: "quiz";
  theme: "culture" | "flags";
  entryId: string;
  prompt: string;
  choices: string[];
  difficulty: Difficulty;
}
export function makeQuizSequence(seed: number, length: number, theme: QuizQuestion["theme"]): QuizQuestion[] {
  const random = seededRandom(seed);
  if (theme === "culture") {
    const draw = drawCycle(CULTURE_QUESTIONS, random);
    return Array.from({ length }, (_, id) => {
      const entry = draw();
      return { id, kind: "quiz", theme, entryId: entry.id, prompt: entry.prompt,
        choices: shuffle(entry.choices, random), difficulty: entry.difficulty };
    });
  }
  const draw = drawCycle(WORLD_COUNTRIES, random);
  return Array.from({ length }, (_, id) => {
    const entry = draw();
    const alternatives = shuffle(WORLD_COUNTRIES.filter((c) => c.id !== entry.id), random)
      .slice(0, 3).map((c) => c.country);
    return { id, kind: "quiz", theme, entryId: entry.id,
      prompt: "À quel pays appartient ce drapeau ?",
      choices: shuffle([entry.country, ...alternatives], random), difficulty: entry.difficulty };
  });
}
export function quizAnswer(question: QuizQuestion): number {
  const label = question.theme === "culture"
    ? CULTURE_QUESTIONS.find((entry) => entry.id === question.entryId)?.choices[0]
    : WORLD_COUNTRIES.find((entry) => entry.id === question.entryId)?.country;
  return question.choices.findIndex((choice) => choice === label);
}
