import { GameModeSelector } from "./GameModeSelector";
import type { GameMode } from "../engine/questions";
import { useState } from "react";
import { LapSelector } from "./LapSelector";
import { CAR_COLORS, type LapCount } from "../engine/config";
import { roomInvite, shareRoom } from "../services/rooms";
import type { MemberView } from "../shared/protocol";
export function Lobby({
  code,
  mode,
  onMode,
  laps,
  onLaps,
  self,
  opponent,
  online,
  onColor,
  onReady,
  onLeave,
}: {
  code: string;
  mode: GameMode;
  laps: LapCount;
  onLaps: (laps: LapCount) => void;
  onMode: (mode: GameMode) => void;
  self?: MemberView;
  opponent?: MemberView;
  online: boolean;
  onColor: (color: string) => void;
  onReady: () => void;
  onLeave: () => void;
}) {
  const [notice, setNotice] = useState("");
  return (
    <section className="control-panel lobby-panel">
      <span className="eyebrow">SALLE {code}</span>
      <h2>
        À deux sur
        <br />
        la ligne de départ.
      </h2>
      <GameModeSelector mode={mode} disabled={!online || self?.id !== 0} onChange={onMode} />
      <LapSelector laps={laps} disabled={!online || self?.id !== 0} onChange={onLaps} />
      <div className="invite-box">
        <label htmlFor="invite-link">Invite ton adversaire</label>
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
          01
        </div>
        <div>
          <strong>{self?.name ?? "Connexion…"}</strong>
          <span>
            {self?.ready ? "Prêt pour le départ" : "Choisis ta carrosserie"}
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
            disabled={!online || self?.ready || opponent?.color === color}
            onClick={() => onColor(color)}
            style={{ background: color }}
            className={self?.color === color ? "selected" : ""}
          >
            {self?.color === color ? "✓" : ""}
          </button>
        ))}
      </fieldset>
      <div className="opponent">
        <span className="opponent-icon" style={{ color: opponent?.color }}>
          02
        </span>
        <div>
          <strong>{opponent?.name ?? "En attente d’un adversaire"}</strong>
          <span>
            {opponent
              ? opponent.connected
                ? opponent.ready
                  ? "Prêt pour le départ"
                  : "A rejoint la salle"
                : "Hors connexion"
              : "Partage le lien ou le code ci-dessus"}
          </span>
        </div>
        {opponent?.ready && <span className="ready-dot" />}
      </div>
      <button
        className="primary-button"
        disabled={!online || !self}
        onClick={onReady}
      >
        {self?.ready ? "Annuler · je ne suis plus prêt" : "Je suis prêt"}{" "}
        <span>↗</span>
      </button>
      <p className="keyboard-hint">Le départ est commun aux deux pilotes.</p>
      <button className="text-button" onClick={onLeave}>
        Quitter la salle
      </button>
    </section>
  );
}
