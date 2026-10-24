import { answer as mathAnswer, type Operation } from "./math";
import { capitalAnswer, type CapitalQuestion } from "./capitals";
import { quizAnswer, type QuizQuestion } from "./quiz";
import type { Theme } from "../constants/themes";
export type GameMode = Theme;
export type Question = Operation | CapitalQuestion | QuizQuestion;
export type ChoiceQuestion = CapitalQuestion | QuizQuestion;
export const isCapital = (question: Question): question is CapitalQuestion =>
  "kind" in question && question.kind === "capital";
export const isChoice = (question: Question): question is ChoiceQuestion => "choices" in question;
export const answer = (question: Question): number =>
  isCapital(question) ? capitalAnswer(question)
    : isChoice(question) ? quizAnswer(question) : mathAnswer(question);
export const answerLabel = (question: Question): string =>
  isChoice(question) ? question.choices[answer(question)] : String(answer(question));
export const questionLabel = (question: Question): string =>
  isCapital(question) ? question.country
    : isChoice(question) ? question.prompt : `${question.a} ${question.operator} ${question.b}`;
