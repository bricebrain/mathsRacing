export const RACE = {
  baseSpeed: 52,
  sequenceLength: 512,
  lapLength: 1050,
  laps: 3,
  countdown: 3000,
  boostDuration: 3000,
  fadeDuration: 650,
  submitDelay: 300,
  skipDelay: 8000,
};
export const DIFFICULTIES = {
  veryEasy: { label: "Très facile", boost: 0.15, color: "#7bdac5" },
  easy: { label: "Facile", boost: 0.3, color: "#a4e86b" },
  medium: { label: "Moyenne", boost: 0.5, color: "#ffc66d" },
  hard: { label: "Difficile", boost: 0.75, color: "#cfadff" },
} as const;
export const CAR_COLORS = ["#b5ef63", "#70cfff", "#ff967b", "#d0a1ff"] as const;
export const TOTAL_DISTANCE = RACE.lapLength * RACE.laps;

export const LAP_OPTIONS = [3, 5, 10] as const;
export type LapCount = (typeof LAP_OPTIONS)[number];
export const raceDistance = (laps: LapCount) => RACE.lapLength * laps;
export const sequenceLength = (laps: LapCount) =>
  Math.ceil((RACE.sequenceLength * laps) / RACE.laps);
