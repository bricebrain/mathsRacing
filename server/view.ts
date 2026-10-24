import { answer, answerLabel, isCapital } from "../src/engine/questions";
import { emptyRace } from "../src/shared/display";
import type { PlayerId, RoomView, PublicRacer } from "../src/shared/protocol";
import type { Room } from "./model";
export function roomView(
  room: Room,
  selfId: PlayerId,
  connected: PlayerId[],
  now: number,
): RoomView {
  const race = room.race;
  const finished = race?.winner !== null && !!race;
  const phase = !race
    ? "lobby"
    : finished
      ? "finished"
      : now < room.startsAt!
        ? "countdown"
        : "racing";
  const state = race
    ? {
        laps: race.laps ?? 3,
        time: race.time,
        winner: race.winner,
        players: race.players.map((player) => {
          const { reviewIds: _review, lastAttempt: _attempt, ...safe } = player;
          return safe;
        }) as [PublicRacer, PublicRacer],
      }
    : emptyRace(room.laps ?? 3);
  return {
    code: room.code,
    mode: room.mode ?? "math",
    selfId,
    raceId: room.raceId,
    revision: room.revision,
    serverTime: now,
    startsAt: room.startsAt,
    phase,
    state,
    members: room.members.map(({ token: _token, ...member }) => ({
      ...member,
      connected: connected.includes(member.id),
    })),
    question:
      race && phase === "racing"
        ? race.sequence[race.players[selfId].index]
        : null,
    review:
      race && finished
        ? race.players[selfId].reviewIds.map((id) => ({
            operation: race.sequence[id],
            answer: isCapital(race.sequence[id])
              ? answerLabel(race.sequence[id])
              : answer(race.sequence[id]),
          }))
        : [],
    reason: room.reason,
  };
}
