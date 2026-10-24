import { PlayerCountSelector } from "./PlayerCountSelector";
import { GameModeSelector } from "./GameModeSelector";
import type { GameMode } from "../engine/questions";
import { useState } from "react";
import { LapSelector } from "./LapSelector";
import { CAR_COLORS, type LapCount, type PlayerCount } from "../engine/config";
import { roomInvite, shareRoom } from "../services/rooms";
import type { MemberView } from "../shared/protocol";
export function Lobby({
  code,
  themes,
  onThemes,
  laps,
  onLaps,
  self,
  opponents,
  capacity,
  onCapacity,
  online,
  onColor,
  onReady,
  onLeave,
}: {
  code: string;
  themes: GameMode[];
  laps: LapCount;
  onLaps: (laps: LapCount) => void;
  onThemes: (theme: GameMode, selected: boolean) => void;
  self?: MemberView;
  opponents: MemberView[];
  capacity: PlayerCount;
  onCapacity: (capacity: PlayerCount) => void;
  online: boolean;
  onColor: (color: string) => void;
  onReady: () => void;
  onLeave: () => void;
}) {
  const [notice, setNotice] = useState("");
  return (
    <section className="control-panel lobby-panel">
      <span className="eyebrow">SALLE {code}</span>
      <PlayerCountSelector capacity={capacity} occupied={opponents.length + 1}
        disabled={!online || self?.id !== 0} onChange={onCapacity} />
      <GameModeSelector themes={themes} disabled={!online || self?.id !== 0} onChange={onThemes} />
      <LapSelector laps={laps} disabled={!online || self?.id !== 0} onChange={onLaps} />
      <div className="invite-box">
        <label htmlFor="invite-link">Invite les autres pilotes</label>
        <input
          id="invite-link"
          readOnly
          value={roomInvite(code)}
          onFocus={(event) => event.target.select()}
        />
        <button
          className="secondary-button"
          onClick={async () => {
            try {
              setNotice(await shareRoom(code));
            } catch {
              setNotice("Copie le lien affiché pour inviter ton adversaire.");
            }
          }}
        >
          Partager l’invitation ↗
        </button>
        {notice && <p role="status">{notice}</p>}
      </div>
      <div className="driver-card">
        <div className="driver-avatar" style={{ color: self?.color }}>
          {String((self?.id ?? 0) + 1).padStart(2, "0")}
        </div>
        <div>
          <strong>{self?.name ?? "Connexion…"}</strong>
          <span>
            {self?.ready ? "Prêt pour le départ" : "En préparation"}
          </span>
        </div>
        {self?.ready && <span className="ready-dot" />}
      </div>
      <fieldset className="color-picker">
        <legend>Ta couleur de carrosserie</legend>
        {CAR_COLORS.map((color, i) => (
          <button
            key={color}
            aria-label={["Vert citron", "Bleu ciel", "Corail", "Violet"][i]}
            aria-pressed={self?.color === color}
            disabled={!online || self?.ready || opponents.some((opponent) => opponent.color === color)}
            onClick={() => onColor(color)}
            style={{ background: color }}
            className={self?.color === color ? "selected" : ""}
          >
            {self?.color === color ? "✓" : ""}
          </button>
        ))}
      </fieldset>
      {Array.from({ length: capacity - 1 }, (_, index) => {
        const opponent = opponents[index];
        return <div className="opponent" key={opponent?.id ?? `waiting-${index}`}>
          <span className="opponent-icon" style={{ color: opponent?.color }}>
            {String((opponent?.id ?? index + 1) + 1).padStart(2, "0")}
          </span>
          <div>
            <strong>{opponent?.name ?? "En attente d’un pilote"}</strong>
            <span>{opponent ? opponent.connected
              ? opponent.ready ? "Prêt pour le départ" : "A rejoint la salle"
              : "Hors connexion" : "Place libre"}</span>
          </div>
          {opponent?.ready && <span className="ready-dot" />}
        </div>;
      })}
      <button
        className="primary-button"
        disabled={!online || !self}
        onClick={onReady}
      >
        {self?.ready ? "Annuler · je ne suis plus prêt" : "Je suis prêt"}{" "}
        <span>↗</span>
      </button>
      <button className="text-button" onClick={onLeave}>
        Quitter la salle
      </button>
    </section>
  );
}
