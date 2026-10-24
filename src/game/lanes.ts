import type { PlayerId } from "../shared/protocol";
export const laneOffset = (id: PlayerId, count: number) =>
  ((count - 1) / 2 - id) * (count === 2 ? 40 : 24);
