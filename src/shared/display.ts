import { RACE, type LapCount, type PlayerCount } from "../engine/config";
import type { DisplayRace, PublicRacer } from "./protocol";
export const emptyRacer = (): PublicRacer => ({
  distance: 0,
  index: 0,
  correct: 0,
  errors: 0,
  skipped: 0,
  questionAt: 0,
  correctionUntil: null,
  boost: 0,
  boostAt: -RACE.boostDuration - RACE.fadeDuration,
  finishedAt: null,
  eliminatedAt: null,
});
export const emptyRace = (laps: LapCount = 3, capacity: PlayerCount = 2): DisplayRace => ({
  laps,
  players: Array.from({ length: capacity }, emptyRacer),
  time: 0,
  winner: null,
  winners: [],
});
