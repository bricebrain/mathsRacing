import type { CAR_COLORS, LapCount, PlayerCount } from "../engine/config";
import type { Racer } from "../engine/race";
import type { GameMode, Question } from "../engine/questions";
export type PlayerId = 0 | 1 | 2 | 3;
export type Phase = "lobby" | "countdown" | "racing" | "finished";
export type PublicRacer = Omit<Racer, "reviewIds" | "lastAttempt">;
export interface DisplayRace {
  laps: LapCount;
  players: PublicRacer[];
  time: number;
  winner: number | null;
  winners: number[];
}
export interface MemberView {
  id: PlayerId;
  name: string;
  color: string;
  ready: boolean;
  rematch: boolean;
  connected: boolean;
}
export interface Review {
  operation: Question;
  answer: number | string;
}
export interface Correction {
  operationId: number;
  answer: string;
  choice: number | null;
  until: number;
}
export interface RoomView {
  capacity: PlayerCount;
  themes: GameMode[];
  correction: Correction | null;
  mode: GameMode;
  code: string;
  selfId: PlayerId;
  raceId: string | null;
  revision: number;
  serverTime: number;
  startsAt: number | null;
  phase: Phase;
  members: MemberView[];
  state: DisplayRace;
  question: Question | null;
  review: Review[];
  reason: "finish" | "forfeit" | "interrupted" | null;
}
export interface Session {
  code: string;
  token: string;
  playerId: PlayerId;
}
export type CarColor = (typeof CAR_COLORS)[number];
interface RaceAction {
  actionId: string;
  raceId: string;
  operationId: number;
}
export type ClientAction =
  | { type: "auth"; token: string; clientId: string; takeover?: boolean }
  | { type: "ping"; sentAt: number }
  | { type: "ready"; ready: boolean }
  | { type: "capacity"; capacity: PlayerCount }
  | { type: "laps"; laps: LapCount }
  | { type: "theme"; theme: GameMode; selected: boolean }
  | { type: "themes"; themes: GameMode[] }
  | { type: "mode"; mode: GameMode }
  | { type: "color"; color: CarColor }
  | { type: "rematch"; ready: boolean }
  | ({ type: "answer"; value: string } & RaceAction)
  | ({ type: "skip" } & RaceAction);
export interface ActionResult {
  type: "action.result";
  actionId: string;
  raceId: string;
  status: "correct" | "wrong" | "skipped" | "ignored";
  message?: string;
}
export type ServerMessage =
  | { type: "room.state"; view: RoomView }
  | ActionResult
  | { type: "error"; message: string; fatal?: boolean }
  | { type: "pong"; serverTime: number; sentAt: number };
export const NETWORK = {
  snapshot: 200,
  interpolation: 180,
  maxPrediction: 400,
  grace: 20000,
  ttl: 30 * 60000,
  heartbeat: 5000,
};
