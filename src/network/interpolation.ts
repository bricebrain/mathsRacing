import { TOTAL_DISTANCE } from "../engine/config";
import { projectDistance } from "../engine/race";
import {
  NETWORK,
  type DisplayRace,
  type RoomView,
  type PublicRacer,
} from "../shared/protocol";
export class RaceInterpolator {
  private snapshots: DisplayRace[] = [];
  private raceId: string | null = null;
  push(view: RoomView) {
    if (view.raceId !== this.raceId) {
      this.raceId = view.raceId;
      this.snapshots = [];
    }
    if (this.snapshots.at(-1)?.time === view.state.time) this.snapshots.pop();
    this.snapshots.push(view.state);
    if (this.snapshots.length > 30) this.snapshots.shift();
  }
  sample(view: RoomView, serverNow: number): DisplayRace {
    const latest = view.state;
    if (view.phase !== "racing" || view.startsAt === null)
      return structuredClone(latest);
    const elapsed = Math.max(0, serverNow - view.startsAt),
      target = Math.max(0, elapsed - NETWORK.interpolation);
    let before = this.snapshots[0] ?? latest,
      after: DisplayRace | undefined;
    for (const snapshot of this.snapshots) {
      if (snapshot.time <= target) before = snapshot;
      else {
        after = snapshot;
        break;
      }
    }
    const players = latest.players.map((player, index) => {
      let distance: number;
      if (after && after.time > before.time) {
        const ratio = Math.max(
          0,
          Math.min(1, (target - before.time) / (after.time - before.time)),
        );
        distance =
          before.players[index].distance +
          (after.players[index].distance - before.players[index].distance) *
            ratio;
      } else {
        const to = Math.max(
          before.time,
          Math.min(target, before.time + NETWORK.maxPrediction),
        );
        distance = projectDistance(before.players[index], before.time, to);
      }
      return {
        ...player,
        distance: Math.min(TOTAL_DISTANCE - 0.001, distance),
      };
    }) as [PublicRacer, PublicRacer];
    return { players, time: elapsed, winner: latest.winner };
  }
}
