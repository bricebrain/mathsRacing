import { RACE, raceDistance } from "../engine/config";
import { raceRank } from "../shared/ranking";
import type { DisplayRace } from "../shared/protocol";
import { formatTime } from "../utils/formatTime";
export function Scoreboard({ state, colors, names }: {
  state: DisplayRace;
  colors: string[];
  names: string[];
}) {
  return <div className={`scoreboard ${state.players.length > 2 ? "scoreboard-many" : ""}`}>
    {state.players.map((player, index) => {
      const rank = raceRank(state, index);
      return <div key={index} className="score-driver">
        <span className="position">{rank}<sup>{rank === 1 ? "er" : "e"}</sup></span>
        <div className="driver-progress">
          <div>
            <strong><i style={{ background: colors[index] }} />
              <span className="driver-name" title={names[index]}>{names[index]}</span>
              {!index && <small>VOUS</small>}
            </strong>
            <span>{player.eliminatedAt != null ? "Abandon" : <>
              Tour {Math.min(state.laps, Math.floor(player.distance / RACE.lapLength) + 1)}
              <em> / {state.laps}</em>
            </>}</span>
          </div>
          <div className="progress-track"><div style={{
            width: `${(100 * player.distance) / raceDistance(state.laps)}%`, background: colors[index],
          }} /></div>
        </div>
      </div>;
    })}
    <div className="race-clock"><span>CHRONO</span><strong>{formatTime(state.time)}</strong></div>
  </div>;
}
