import { RACE, TOTAL_DISTANCE } from "../engine/config";
import type { DisplayRace } from "../shared/protocol";
import { formatTime } from "./Results";
export function Scoreboard({
  state,
  colors,
  names,
}: {
  state: DisplayRace;
  colors: [string, string];
  names: [string, string];
}) {
  return (
    <div className="scoreboard">
      {state.players.map((p, i) => (
        <div key={i} className="score-driver">
          <span className="position">
            {state.players[1 - i].distance > p.distance ? "2" : "1"}
            <sup>{state.players[1 - i].distance > p.distance ? "e" : "er"}</sup>
          </span>
          <div className="driver-progress">
            <div>
              <strong>
                <i style={{ background: colors[i] }} />
                <span className="driver-name" title={names[i]}>
                  {names[i]}
                </span>
                {!i && <small>VOUS</small>}
              </strong>
              <span>
                Tour{" "}
                {Math.min(
                  RACE.laps,
                  Math.floor(p.distance / RACE.lapLength) + 1,
                )}
                <em> / {RACE.laps}</em>
              </span>
            </div>
            <div className="progress-track">
              <div
                style={{
                  width: `${(100 * p.distance) / TOTAL_DISTANCE}%`,
                  background: colors[i],
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="race-clock">
        <span>CHRONO</span>
        <strong>{formatTime(state.time)}</strong>
      </div>
    </div>
  );
}
