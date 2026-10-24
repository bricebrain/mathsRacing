import { answer as mathAnswer, type Operation } from "./math";
import { capitalAnswer, type CapitalQuestion } from "./capitals";
export type GameMode = "math" | "capitals";
export type Question = Operation | CapitalQuestion;
export const isCapital = (question: Question): question is CapitalQuestion =>
  "kind" in question && question.kind === "capital";
export const answer = (question: Question): number =>
  isCapital(question) ? capitalAnswer(question) : mathAnswer(question);
export const answerLabel = (question: Question): string =>
  isCapital(question) ? question.choices[answer(question)] : String(answer(question));
