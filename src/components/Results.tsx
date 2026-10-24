import { useEffect } from "react";
import { TOTAL_DISTANCE } from "../engine/config";
import type { DisplayRace, Review } from "../shared/protocol";
export const formatTime = (ms: number) =>
  `${Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0")}:${((ms / 1000) % 60).toFixed(1).padStart(4, "0")}`;
export function Results({
  state,
  onReplay,
  onBack,
  review,
  opponent,
  rematch,
  disabled,
  reason,
}: {
  state: DisplayRace;
  review: Review[];
  opponent: string;
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
  return (
    <div className="overlay results-overlay">
      <section
        className="result-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <span className="eyebrow">DRAPEAU À DAMIER</span>
        <div className="trophy">⚑</div>
        <h2 id="result-title">
          {reason === "interrupted"
            ? "Course interrompue"
            : state.winner === -1
              ? "Égalité parfaite !"
              : state.winner === 0
                ? "Belle victoire !"
                : "La revanche t’attend."}
        </h2>
        <p>
          {reason === "interrupted"
            ? "Rejouez lorsque les deux connexions sont rétablies."
            : reason === "forfeit"
              ? state.winner === 0
                ? "Ton adversaire n’a pas pu revenir à temps."
                : "La connexion n’a pas été rétablie à temps."
              : state.winner === 0
                ? "Ton calcul mental a fait la différence."
                : state.winner === -1
                  ? "Même chrono, même ligne d’arrivée."
                  : `${opponent} remporte la course.`}
        </p>
        {reason === "forfeit" && (
          <p>Victoire par abandon après une déconnexion prolongée.</p>
        )}
        {reason === "interrupted" && (
          <p>Course interrompue : les deux pilotes étaient déconnectés.</p>
        )}
        <table>
          <caption>Bilan de la course multijoueur</caption>
          <thead>
            <tr>
              <th>Statistiques</th>
              <th>Toi</th>
              <th>{opponent}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Temps</td>
              {state.players.map((p, i) => (
                <td key={i}>
                  {p.finishedAt === null
                    ? "Non terminé"
                    : formatTime(p.finishedAt)}
                </td>
              ))}
            </tr>
            <tr>
              <td>Bonnes réponses</td>
              {state.players.map((p, i) => (
                <td key={i}>{p.correct}</td>
              ))}
            </tr>
            <tr>
              <td>Erreurs</td>
              {state.players.map((p, i) => (
                <td key={i}>{p.errors}</td>
              ))}
            </tr>
            <tr>
              <td>Calculs passés</td>
              {state.players.map((p, i) => (
                <td key={i}>{p.skipped}</td>
              ))}
            </tr>
            <tr>
              <td title="Bonnes réponses divisées par les bonnes réponses, erreurs et calculs passés.">
                Réussite
              </td>
              {state.players.map((p, i) => (
                <td key={i}>
                  {p.correct + p.errors + p.skipped
                    ? Math.round(
                        (100 * p.correct) / (p.correct + p.errors + p.skipped),
                      )
                    : 0}{" "}
                  %
                </td>
              ))}
            </tr>
            <tr>
              <td>Boosts obtenus</td>
              {state.players.map((p, i) => (
                <td key={i}>{p.correct}</td>
              ))}
            </tr>
            <tr>
              <td>Distance</td>
              {state.players.map((p, i) => (
                <td key={i}>
                  {Math.round(p.distance)} / {TOTAL_DISTANCE} m
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {review.length > 0 && (
          <details className="review-calculations">
            <summary>À revoir · {review.length} calcul(s)</summary>
            <p>Les calculs passés ou ayant entraîné une erreur :</p>
            <ul>
              {review.map(({ operation, answer }) => {
                return (
                  <li key={operation.id}>
                    {operation.a} {operation.operator} {operation.b} ={" "}
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
