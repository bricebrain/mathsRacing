import { useState } from "react";
export function SessionEntry({
  invite,
  busy,
  error,
  onEnter,
}: {
  invite: string;
  busy: boolean;
  error: string;
  onEnter: (name: string, code?: string) => void;
}) {
  const [name, setName] = useState(""),
    [code, setCode] = useState(invite);
  return (
    <section className="control-panel session-entry">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onEnter(name, code || undefined);
        }}
      >
        <label htmlFor="nickname">Ton pseudo</label>
        <input
          id="nickname"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={16}
          autoComplete="nickname"
          placeholder="Ton nom de pilote"
          required
          disabled={busy}
        />
        <button
          type="button"
          className="primary-button"
          disabled={busy || !name.trim()}
          onClick={() => onEnter(name)}
        >
          Créer une salle <span>↗</span>
        </button>
        <div className="entry-divider">ou rejoins une course</div>
        <label htmlFor="room-code">Code de la salle</label>
        <input
          id="room-code"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z2-9]/g, "")
                .slice(0, 6),
            )
          }
          placeholder="ABC234"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          disabled={busy}
        />
        <button
          className="secondary-button"
          type="submit"
          disabled={busy || !name.trim() || code.length !== 6}
        >
          Rejoindre la salle
        </button>
        {busy && (
          <p role="status" className="muted">
            Connexion à la salle…
          </p>
        )}
        {error && (
          <p role="alert" className="room-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
