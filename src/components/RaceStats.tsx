import { Box } from "@mui/material";
import { raceDistance } from "../engine/config";
import { raceRank, rankedIndices } from "../shared/ranking";
import type { DisplayRace, PublicRacer } from "../shared/protocol";
import { formatTime } from "../utils/formatTime";
export function RaceStats({ state, names }: { state: DisplayRace; names: string[] }) {
  const order = rankedIndices(state);
  const rows: [string, (player: PublicRacer, index: number) => string | number][] = [
    ["Classement", (_, index) => `${raceRank(state, index)}${raceRank(state, index) === 1 ? "er" : "e"}`],
    ["Temps", (p) => p.eliminatedAt != null ? "Abandon" : p.finishedAt === null ? "Non terminé" : formatTime(p.finishedAt)],
    ["Bonnes réponses", (p) => p.correct],
    ["Erreurs", (p) => p.errors],
    ["Questions passées", (p) => p.skipped],
    ["Réussite", (p) => `${p.correct + p.errors + p.skipped ? Math.round(100 * p.correct / (p.correct + p.errors + p.skipped)) : 0} %`],
    ["Boosts obtenus", (p) => p.correct],
    ["Distance", (p) => `${Math.round(p.distance)} / ${raceDistance(state.laps)} m`],
  ];
  return <Box sx={{ overflowX: "auto" }} tabIndex={state.players.length > 2 ? 0 : undefined}
    role="region" aria-label="Classement et statistiques des pilotes">
    <table style={{ minWidth: state.players.length > 2 ? 500 : undefined }}>
      <caption>Bilan de la course multijoueur</caption>
      <thead><tr><th>Statistiques</th>{order.map((index) =>
        <th key={index}>{index === 0 ? "Toi" : names[index]}</th>)}</tr></thead>
      <tbody>{rows.map(([label, value]) => <tr key={label}>
        <td>{label}</td>{order.map((index) => <td key={index}>{value(state.players[index], index)}</td>)}
      </tr>)}</tbody>
    </table>
  </Box>;
}
