import { Box } from "@mui/material";
import { DIFFICULTIES, RACE } from "../engine/config";
import { boostAt, skipRemaining } from "../engine/race";
import type { DisplayRace, Correction } from "../shared/protocol";
import { isChoice, type Question } from "../engine/questions";
import { QuestionChoices } from "./QuestionChoices";
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
  correction,
}: {
  state: DisplayRace;
  correction: Correction | null;
  operation: Question | null;
  input: string;
  feedback: string;
  active: boolean;
  onKey: (key: string) => void;
  onSkip: () => void;
  onChoose: (index: number) => void;
}) {
  const player = state.players[0];
  const eliminated = player.eliminatedAt != null;
  const choice = operation && isChoice(operation) ? operation : null;
  const calculation = operation && !isChoice(operation) ? operation : null;
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
        <span className="boost-value">+{difficulty.boost * 100} %</span>
        <span className="difficulty" style={{ color: difficulty.color }}>
          <i /> {difficulty.label}
        </span>
      </div>
      {eliminated ? (
        <Box role="status" sx={{ my: 3, color: "#ffda9c", fontSize: 14, lineHeight: 1.6 }}>
          Tu es en abandon après une déconnexion prolongée. Les autres pilotes continuent la course.
        </Box>
      ) : choice ? (
        <QuestionChoices question={choice} active={active} correction={correction} onChoose={onChoose} />
      ) : <div className="question">
        <span>
          {calculation?.a ?? "—"} <em>{calculation?.operator ?? "+"}</em>{" "}
          {calculation?.b ?? "—"}
        </span>
        <span className="equals">=</span>
        <output aria-label="Réponse saisie">
          {correction?.answer ?? (input || <span className="input-caret">?</span>)}
        </output>
      </div>}
      <div className="answer-actions">
        <div className="answer-feedback" aria-live="polite">
          {correction ? (
            <>Bonne réponse : <strong>{correction.answer}</strong> · {Math.max(0, Math.ceil((correction.until - state.time) / 1000))} s</>
          ) : feedback === "correct" ? (
            "✓ Bien joué ! Turbo enclenché."
          ) : feedback === "wrong" ? (
            "Correction…"
          ) : feedback === "skipped" ? (
            "Question passée, sans nouveau turbo."
          ) : feedback === "pending" ? (
            "Validation…"
          ) : feedback === "ignored" ? (
            "Attends un instant puis réessaie."
          ) : (
            null
          )}
        </div>
        <button
          className="skip-button"
          onClick={onSkip}
          disabled={!active || skipWait > 0}
        >
          {skipWait > 0 ? `Passer · ${skipWait} s` : "Passer →"}
        </button>
      </div>
      {!eliminated && !choice && <Keypad onKey={onKey} disabled={!active} />}
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

      </div>
      <div className="personal-stats">
        <span>
          <strong>{player.correct}</strong> bonnes réponses
        </span>
        <span>
          <strong>{Math.round(RACE.baseSpeed * (1 + turbo) * 3.6)}</strong> km/h
        </span>
      </div>
    </section>
  );
}
