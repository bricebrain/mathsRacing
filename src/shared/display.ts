import { RACE, type LapCount } from "../engine/config";
import type { DisplayRace, PublicRacer } from "./protocol";
export const emptyRacer = (): PublicRacer => ({
  distance: 0,
  index: 0,
  correct: 0,
  errors: 0,
  skipped: 0,
  questionAt: 0,
  boost: 0,
  boostAt: -RACE.boostDuration - RACE.fadeDuration,
  finishedAt: null,
});
export const emptyRace = (laps: LapCount = 3): DisplayRace => ({
  laps,
  players: [emptyRacer(), emptyRacer()],
  time: 0,
  winner: null,
});
