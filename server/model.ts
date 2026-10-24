import { CAR_COLORS, type LapCount, type PlayerCount } from "../src/engine/config";
import {
  NETWORK,
  type ActionResult,
  type CarColor,
  type PlayerId,
} from "../src/shared/protocol";
import type { RaceState } from "../src/engine/race";
export interface Member {
  id: PlayerId;
  name: string;
  token: string;
  color: CarColor;
  ready: boolean;
  rematch: boolean;
}
import type { GameMode } from "../src/engine/questions";
export interface Room {
  capacity: PlayerCount;
  laps: LapCount;
  mode: GameMode;
  themes: GameMode[];
  code: string;
  members: Member[];
  revision: number;
  expiresAt: number;
  race: RaceState | null;
  raceId: string | null;
  startsAt: number | null;
  disconnectedAt: (number | null)[];
  receipts: { playerId: PlayerId; ack: ActionResult }[];
  reason: "finish" | "forfeit" | "interrupted" | null;
}
export const member = (
  id: PlayerId,
  name: string,
  color: CarColor = CAR_COLORS[id],
): Member => ({
  id,
  name,
  color,
  token: crypto.randomUUID(),
  ready: false,
  rematch: false,
});
export const makeRoom = (code: string, name: string, now: number): Room => ({
  code,
  capacity: 2,
  mode: "math",
  themes: ["math"],
  laps: 3,
  members: [member(0, name)],
  revision: 0,
  expiresAt: now + NETWORK.ttl,
  race: null,
  raceId: null,
  startsAt: null,
  disconnectedAt: [null, null],
  receipts: [],
  reason: null,
});
