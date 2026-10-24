import { Box } from "@mui/material";
import { isChoice, isCapital, questionLabel, type GameMode } from "../engine/questions";
import { useEffect } from "react";
import { RaceStats } from "./RaceStats";
import type { DisplayRace, Review } from "../shared/protocol";
export function Results({
  state,
  themes,
  onReplay,
  onBack,
  review,
  names,
  rematch,
  disabled,
  reason,
}: {
  state: DisplayRace;
  themes: GameMode[];
  review: Review[];
  names: string[];
  rematch: boolean;
  disabled: boolean;
  reason: string | null;
  onReplay: () => void;
  onBack: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  const won = state.winners.includes(0);
  const tied = state.winners.length > 1;
  const winnerNames = state.winners.map((index) => index === 0 ? "Toi" : names[index]).join(" et ");
  return (
    <div className="overlay results-overlay">
      <section
        className={`result-card ${state.players.length > 2 ? "result-card-many" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <span className="eyebrow">DRAPEAU À DAMIER</span>
        <div className="trophy">⚑</div>
        <h2 id="result-title">
          {reason === "interrupted"
            ? "Course interrompue"
            : tied && won
              ? state.winners.length === state.players.length ? "Égalité parfaite !" : "Victoire partagée !"
              : won
                ? "Belle victoire !"
                : "La revanche t’attend."}
        </h2>
        <p>
          {reason === "interrupted"
            ? "Rejouez lorsque les connexions sont rétablies."
            : reason === "forfeit"
              ? won
                ? "Les autres pilotes n’ont pas pu revenir à temps."
                : "La connexion n’a pas été rétablie à temps."
              : won
                ? themes.some((theme) => theme !== "math")
                  ? "Tes connaissances ont fait la différence !"
                  : "Ton calcul mental a fait la différence."
                : tied
                  ? `${winnerNames} partagent la victoire.`
                  : `${winnerNames} remporte la course.`}
        </p>
        {reason === "forfeit" && (
          <p>Victoire par abandon après une déconnexion prolongée.</p>
        )}
        {reason === "interrupted" && (
          <p>Course interrompue : tous les pilotes ont abandonné.</p>
        )}
        <RaceStats state={state} names={names} />
        {review.length > 0 && (
          <details className="review-calculations">
            <summary>À revoir · {review.length} question(s)</summary>
            <p>Les questions passées ou ayant entraîné une erreur :</p>
            <ul>
              {review.map(({ operation, answer }) => {
                return (
                  <li key={operation.id}>
                    {isChoice(operation) && !isCapital(operation) && operation.theme === "flags" &&
                      <Box component="img" src={`/flags/${operation.entryId.toLowerCase()}.svg`}
                        alt={`Drapeau : ${answer}`} sx={{ width: 48, height: 28,
                          objectFit: "contain", display: "block", mb: 0.5 }} />}

                    {isChoice(operation)
                      ? `${questionLabel(operation)} → `
                      : `${operation.a} ${operation.operator} ${operation.b} = `}
                    <strong>{answer}</strong>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
        <button
          className="primary-button"
          autoFocus
          onClick={onReplay}
          disabled={disabled || rematch}
        >
          {rematch ? "En attente de la revanche…" : "Demander une revanche"}{" "}
          <span>↗</span>
        </button>
        <button className="text-button" onClick={onBack}>
          Quitter la salle
        </button>
      </section>
    </div>
  );
}
