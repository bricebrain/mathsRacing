import { playerOrder } from "./shared/ranking";
import { CAR_COLORS } from "./engine/config";
import { useSession } from "./hooks/useSession";
import { useNetworkRace } from "./hooks/useNetworkRace";
import { useRaceAudio } from "./hooks/useRaceAudio";
import { SoundToggle } from "./components/SoundToggle";
import { RaceCanvas } from "./components/RaceCanvas";
import { Scoreboard } from "./components/Scoreboard";
import { Lobby } from "./components/Lobby";
import { SessionEntry } from "./components/SessionEntry";
import { ConnectionNotice } from "./components/ConnectionNotice";
import { CalculationPanel } from "./components/CalculationPanel";
import { Results } from "./components/Results";
export default function App() {
  const session = useSession(),
    game = useNetworkRace(session.session);
  const sound = useRaceAudio(game.race, game.phase, game.countdown);
  const laps = game.view?.state.laps ?? 3;
  const themes = game.view?.themes ?? [game.view?.mode ?? "math"];
  const isLobby = game.phase === "lobby",
    online = game.connection === "online";
  const capacity = game.view?.capacity ?? 2;
  const selfId = game.view?.selfId ?? 0;
  const ids = playerOrder(capacity, selfId);
  const colors = ids.map((id) => game.view?.members.find((member) => member.id === id)?.color ?? CAR_COLORS[id]);
  const names = ids.map((id) => game.view?.members.find((member) => member.id === id)?.name ?? `Pilote ${id + 1}`);
  return (
    <div className={`app phase-${game.phase} players-${capacity}`}>
      <main>
        {session.session && (
          <ConnectionNotice
            status={game.connection}
            error={game.error}
            onReconnect={game.reconnect}
            onLeave={session.leave}
          />
        )}
        <div className="game-layout">
          <section className="circuit-card" aria-label="Course">
            <div className="race-summary">
              <Scoreboard state={game.race.current} colors={colors} names={names} />
              <SoundToggle enabled={sound.enabled} available={sound.available} onToggle={sound.toggle} />
            </div>
            <div className="track-container">
              <RaceCanvas
                source={{
                  state: game.race.current,
                  colors,
                  ids,
                  active: game.phase === "racing",
                }}
              />
              {game.phase === "countdown" && (
                <div className="countdown-overlay">
                  <strong key={game.countdown}>{game.countdown}</strong>
                </div>
              )}
            </div>
          </section>
          {!session.session ? (
            <SessionEntry
              key={session.invite}
              invite={session.invite}
              busy={session.busy}
              error={session.error}
              onEnter={(name, code) => {
                sound.unlock();
                void session.enter(name, code);
              }}
            />
          ) : isLobby ? (
            <Lobby
              code={session.session.code}
              themes={themes}
              onThemes={game.setTheme}
              laps={laps}
              onLaps={game.setLaps}
              self={game.self}
              opponents={game.opponents}
              capacity={capacity}
              onCapacity={game.setCapacity}
              online={online}
              onColor={game.setColor}
              onReady={() => {
                sound.unlock();
                game.ready();
              }}
              onLeave={session.leave}
            />
          ) : (
            <CalculationPanel
              state={game.race.current}
              operation={game.view?.question ?? null}
              correction={game.view?.correction ?? null}
              input={game.input}
              feedback={game.feedback}
              active={game.active}
              onChoose={game.choose}
              onKey={game.key}
              onSkip={game.skip}
            />
          )}
        </div>
      </main>
      {game.phase === "finished" && (
        <Results
          state={game.race.current}
          review={game.view?.review ?? []}
          themes={themes}
          names={names}
          rematch={game.self?.rematch ?? false}
          disabled={!online}
          reason={game.view?.reason ?? null}
          onReplay={() => {
            sound.unlock();
            game.replay();
          }}
          onBack={session.leave}
        />
      )}
    </div>
  );
}
