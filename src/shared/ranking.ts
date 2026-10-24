import type { DisplayRace, PlayerId } from "./protocol";
export const playerOrder = (count: number, selfId: PlayerId): PlayerId[] =>
  Array.from({ length: count }, (_, id) => id as PlayerId)
    .sort((a, b) => a === selfId ? -1 : b === selfId ? 1 : a - b);
export function perspective(state: DisplayRace, selfId: PlayerId): DisplayRace {
  const order = playerOrder(state.players.length, selfId);
  return {
    ...state,
    players: order.map((id) => state.players[id]),
    winner: state.winner === null || state.winner === -1 ? state.winner : order.indexOf(state.winner as PlayerId),
    winners: state.winners.map((id) => order.indexOf(id as PlayerId)),
  };
}
export function compareRacers(state: DisplayRace, a: number, b: number): number {
  const group = (id: number) => state.winners.includes(id) ? 0
    : state.players[id].eliminatedAt == null ? 1 : 2;
  const category = group(a) - group(b);
  if (category) return category;
  const gap = state.players[b].distance - state.players[a].distance;
  return Math.abs(gap) < 0.01 ? 0 : gap;
}
export const raceRank = (state: DisplayRace, index: number): number =>
  1 + state.players.filter((_, id) => compareRacers(state, id, index) < 0).length;
export const rankedIndices = (state: DisplayRace): number[] =>
  state.players.map((_, id) => id).sort((a, b) => compareRacers(state, a, b) || a - b);
