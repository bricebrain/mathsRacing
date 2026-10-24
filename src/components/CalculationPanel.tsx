import { DIFFICULTIES, RACE } from "../engine/config";
import { boostAt, skipRemaining } from "../engine/race";
import type { DisplayRace } from "../shared/protocol";
import { isCapital, type Question } from "../engine/questions";
import { CapitalChoices } from "./CapitalChoices";
import { Keypad } from "./Keypad";
export function CalculationPanel({
  state,
  operation,
  input,
  feedback,
  active,
  onKey,
  onSkip,
  onChoose,
}: {
  state: DisplayRace;
  operation: Question | null;
  input: string;
  feedback: string;
  active: boolean;
  onKey: (key: string) => void;
  onSkip: () => void;
  onChoose: (index: number) => void;
}) {
  const player = state.players[0];
  const capital = operation && isCapital(operation) ? operation : null;
  const calculation = operation && !isCapital(operation) ? operation : null;
  const difficulty = DIFFICULTIES[operation?.difficulty ?? "veryEasy"],
    turbo = boostAt(player, state.time);
  const remaining = Math.max(
    0,
    RACE.boostDuration - (state.time - player.boostAt),
  );
  const skipWait = Math.min(
    8,
    Math.ceil(skipRemaining(player, state.time) / 1000),
  );
  return (
    <section className={`control-panel calculation-panel ${feedback}`}>
      <div className="question-heading">
        <span className="eyebrow">À TOI DE JOUER</span>
        <span className="difficulty" style={{ color: difficulty.color }}>
          <i /> {difficulty.label}
        </span>
      </div>
      {capital ? (
        <CapitalChoices question={capital} active={active} onChoose={onChoose} />
      ) : <div className="question">
        <span>
          {calculation?.a ?? "—"} <em>{calculation?.operator ?? "+"}</em>{" "}
          {calculation?.b ?? "—"}
        </span>
        <span className="equals">=</span>
        <output aria-label="Réponse saisie">
          {input || <span className="input-caret">?</span>}
        </output>
      </div>}
      <div className="answer-actions">
        <div className="answer-feedback" aria-live="polite">
          {feedback === "correct" ? (
            "✓ Bien joué ! Turbo enclenché."
          ) : feedback === "wrong" ? (
            "Presque ! Essaie encore."
          ) : feedback === "skipped" ? (
            "Question passée, sans nouveau turbo."
          ) : feedback === "pending" ? (
            "Validation…"
          ) : feedback === "ignored" ? (
            "Attends un instant puis réessaie."
          ) : (
            <>
              Une bonne réponse ={" "}
              <strong>+{difficulty.boost * 100} % de vitesse</strong>
            </>
          )}
        </div>
        <button
          className="skip-button"
          onClick={onSkip}
          disabled={!active || skipWait > 0}
          title="Passer après 8 secondes, sans nouveau boost. La question sera à revoir à l’arrivée."
        >
          {skipWait > 0 ? `Passer · ${skipWait} s` : "Passer →"}
        </button>
      </div>
      {!capital && <Keypad onKey={onKey} disabled={!active} />}
      <div className={`turbo-gauge ${turbo ? "boosting" : ""}`}>
        <div>
          <span>ϟ TURBO {turbo ? "ACTIF" : "EN ATTENTE"}</span>
          <strong>
            {turbo ? `+${Math.round(turbo * 100)} %` : "Prêt à booster"}
          </strong>
        </div>
        <div className="turbo-track">
          <div
            style={{ width: `${(remaining / RACE.boostDuration) * 100}%` }}
          />
        </div>
        <small>
          {turbo
            ? `${(remaining / 1000).toFixed(1)} s de boost`
            : "Chaque bonne réponse relance 3 secondes de boost"}
        </small>
      </div>
      <div className="personal-stats">
        <span>
          <strong>{player.correct}</strong> bonnes réponses
        </span>
        <span>
          <strong>{Math.round(RACE.baseSpeed * (1 + turbo) * 3.6)}</strong> km/h
        </span>
      </div>
      <p className="keyboard-hint">
        {capital ? "Choisis une capitale · Clavier : touches 1 à 4"
          : "Clavier : chiffres · Entrée pour valider · ⌫ pour effacer"}
      </p>
    </section>
  );
}
