import { DIFFICULTIES, RACE, raceDistance, sequenceLength, type LapCount } from "./config";
import { makeSequence } from "./math";
import { makeCapitalSequence } from "./capitals";
import { answer, isCapital, type Question, type GameMode } from "./questions";
export interface Racer {
  distance: number;
  index: number;
  errors: number;
  correct: number;
  skipped: number;
  questionAt: number;
  reviewIds: number[];
  boost: number;
  boostAt: number;
  lastAttempt: number;
  finishedAt: number | null;
}
export interface RaceState {
  laps: LapCount;
  sequence: Question[];
  players: [Racer, Racer];
  time: number;
  winner: number | null;
}
const racer = (): Racer => ({
  distance: 0,
  index: 0,
  errors: 0,
  correct: 0,
  skipped: 0,
  questionAt: 0,
  reviewIds: [],
  boost: 0,
  boostAt: -RACE.boostDuration - RACE.fadeDuration,
  lastAttempt: -RACE.submitDelay,
  finishedAt: null,
});
export const createRace = (seed: number, mode: GameMode = "math", laps: LapCount = 3): RaceState => ({
  laps,
  sequence: mode === "capitals"
    ? makeCapitalSequence(seed, sequenceLength(laps))
    : makeSequence(seed, sequenceLength(laps)),
  players: [racer(), racer()],
  time: 0,
  winner: null,
});
export function boostAt(
  player: Pick<Racer, "boost" | "boostAt">,
  time: number,
) {
  const age = time - player.boostAt;
  return (
    player.boost *
    Math.max(0, Math.min(1, 1 - (age - RACE.boostDuration) / RACE.fadeDuration))
  );
}
function boostArea(player: Pick<Racer, "boost" | "boostAt">, time: number) {
  const age = Math.max(0, time - player.boostAt);
  if (!player.boost || !Number.isFinite(age)) return 0;
  const fade = Math.min(
    RACE.fadeDuration,
    Math.max(0, age - RACE.boostDuration),
  );
  return (
    player.boost *
    (Math.min(age, RACE.boostDuration) +
      fade -
      (fade * fade) / (2 * RACE.fadeDuration))
  );
}
export function projectDistance(
  player: Pick<Racer, "distance" | "boost" | "boostAt">,
  from: number,
  to: number,
) {
  return (
    player.distance +
    (RACE.baseSpeed / 1000) *
      (to - from + boostArea(player, to) - boostArea(player, from))
  );
}
export function advance(state: RaceState, time: number) {
  if (time <= state.time || state.winner !== null) return;
  const totalDistance = raceDistance(state.laps);
  const previous = state.time;
  const distanceAt = (player: Racer, at: number) =>
    player.distance +
    (RACE.baseSpeed / 1000) *
      (at - previous + boostArea(player, at) - boostArea(player, previous));
  const arrivals = state.players.map((player) => {
    if (distanceAt(player, time) < totalDistance) return null;
    let low = previous,
      high = time;
    for (let i = 0; i < 32; i++) {
      const middle = (low + high) / 2;
      if (distanceAt(player, middle) >= totalDistance) high = middle;
      else low = middle;
    }
    return high;
  });
  // Même après une longue frame, toute la course s'arrête au premier franchissement.
  const stopAt = Math.min(
    time,
    ...arrivals.filter((at): at is number => at !== null),
  );
  state.players.forEach((player, index) => {
    const arrivedAt = arrivals[index];
    const finished = arrivedAt !== null && arrivedAt - stopAt < 0.01;
    player.distance = finished ? totalDistance : distanceAt(player, stopAt);
    player.finishedAt = finished ? arrivedAt : null;
  });
  state.time = stopAt;
  const finishers = state.players
    .map((player, index) => ({ index, at: player.finishedAt }))
    .filter((player) => player.at !== null)
    .sort((a, b) => a.at! - b.at!);
  if (finishers.length)
    state.winner = finishers.length === 2 ? -1 : finishers[0].index;
}

export function submit(
  state: RaceState,
  playerIndex: number,
  value: string,
  operationId: number,
  time: number,
): "correct" | "wrong" | "ignored" {
  advance(state, time);
  const p = state.players[playerIndex],
    op = state.sequence[p.index];
  if (
    state.winner !== null ||
    !op ||
    op.id !== operationId ||
    !(isCapital(op) ? /^[0-3]$/.test(value) : /^\d{1,3}$/.test(value)) ||
    time - p.lastAttempt < RACE.submitDelay
  )
    return "ignored";
  p.lastAttempt = time;
  if (Number(value) !== answer(op)) {
    p.errors++;
    if (!p.reviewIds.includes(op.id)) p.reviewIds.push(op.id);
    return "wrong";
  }
  p.index++;
  p.correct++;
  p.questionAt = time;
  p.boost = DIFFICULTIES[op.difficulty].boost;
  p.boostAt = time;
  return "correct";
}

export const skipRemaining = (
  player: Pick<Racer, "questionAt">,
  time: number,
) => Math.max(0, player.questionAt + RACE.skipDelay - time);

export function skipOperation(
  state: RaceState,
  playerIndex: number,
  operationId: number,
  time: number,
): boolean {
  advance(state, time);
  const player = state.players[playerIndex];
  const operation = state.sequence[player.index];
  if (
    state.winner !== null ||
    !operation ||
    operation.id !== operationId ||
    skipRemaining(player, time) > 0 ||
    time - player.lastAttempt < RACE.submitDelay
  )
    return false;
  player.skipped++;
  if (!player.reviewIds.includes(operation.id))
    player.reviewIds.push(operation.id);
  player.index++;
  player.questionAt = time;
  player.lastAttempt = time;
  return true;
}
