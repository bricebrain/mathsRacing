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
import type { PlayerId } from "./shared/protocol";
export default function App() {
  const session = useSession(),
    game = useNetworkRace(session.session);
  const sound = useRaceAudio(game.race, game.phase, game.countdown);
  const isLobby = game.phase === "lobby",
    online = game.connection === "online";
  const colors: [string, string] = [
    game.self?.color ?? CAR_COLORS[0],
    game.opponent?.color ?? CAR_COLORS[1],
  ];
  const names: [string, string] = [
    game.self?.name ?? "Toi",
    game.opponent?.name ?? "Adversaire",
  ];
  const selfId = game.view?.selfId ?? 0,
    ids: [PlayerId, PlayerId] = [selfId, (1 - selfId) as PlayerId];
  return (
    <div className={`app phase-${game.phase}`}>
      <header className="site-header">
        <a href="/" className="brand" aria-label="Math Racing, accueil">
          <svg viewBox="0 0 40 36" aria-hidden="true">
            <path
              d="M2 28 13 7h8l-5 11L28 7h10L22 28h-8l5-11L9 28Z"
              fill="currentColor"
            />
          </svg>
          <span>
            MATH<span>RACING</span>
          </span>
        </a>
        <div className="header-right">
          <span className="local-status">
            <i /> MULTIJOUEUR
          </span>
          <span className="version">V0.2</span>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <span className="eyebrow">DU CALCUL. DU TURBO. DU DUEL.</span>
            <h1>
              {isLobby
                ? "La victoire se calcule."
                : "Fais parler les chiffres."}
            </h1>
          </div>
          <span className="session-tag">
            {session.session
              ? `SALLE ${session.session.code}`
              : "COURSE À DEUX"}{" "}
            <b>01</b>
          </span>
        </div>
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
            <div className="circuit-topbar">
              <div>
                <span className="live-dot" /> LES PINS{" "}
                <span className="circuit-subtitle">/ CIRCUIT 01</span>
              </div>
              <div className="circuit-actions">
                <span>
                  3 TOURS <i>•</i> {isLobby ? "DÉPART À DEUX" : "DUEL EN LIGNE"}
                </span>
                <SoundToggle
                  enabled={sound.enabled}
                  available={sound.available}
                  onToggle={sound.toggle}
                />
              </div>
            </div>
            <Scoreboard
              state={game.race.current}
              colors={colors}
              names={names}
            />
            <div className="track-container">
              <RaceCanvas
                source={{
                  state: game.race.current,
                  colors,
                  ids,
                  active: game.phase === "racing",
                }}
              />
              {isLobby && (
                <div className="track-caption">
                  <span className="track-number">01</span>
                  <div>
                    <span className="eyebrow">
                      LE PREMIER VIRAGE VERS LA VICTOIRE
                    </span>
                    <strong>Les Pins</strong>
                    <span>3 tours. Deux pilotes. Un seul vainqueur.</span>
                  </div>
                </div>
              )}
              {game.phase === "countdown" && (
                <div className="countdown-overlay">
                  <span>EN POSITION</span>
                  <strong key={game.countdown}>{game.countdown}</strong>
                  <p>Un bon calcul. Un coup d’avance.</p>
                </div>
              )}
            </div>
            <div className="track-footer">
              <span>
                <i style={{ background: colors[0] }} />
                {names[0]}{" "}
                <i className="coral-dot" style={{ background: colors[1] }} />
                {names[1]}
              </span>
              <span>
                VUE DU DESSUS <b>↗</b>
              </span>
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
              self={game.self}
              opponent={game.opponent}
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
              input={game.input}
              feedback={game.feedback}
              active={game.active}
              onKey={game.key}
              onSkip={game.skip}
            />
          )}
        </div>
        <footer className="page-footer">
          <span>La bonne trajectoire commence par la bonne réponse.</span>
          <span>
            100 % calcul mental <i>·</i> 0 % pilotage
          </span>
        </footer>
      </main>
      {game.phase === "finished" && (
        <Results
          state={game.race.current}
          review={game.view?.review ?? []}
          opponent={names[1]}
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
