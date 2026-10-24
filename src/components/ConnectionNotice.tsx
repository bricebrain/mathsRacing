import type { ConnectionStatus } from "../network/RoomConnection";
export function ConnectionNotice({
  status,
  error,
  onReconnect,
  onLeave,
}: {
  status: ConnectionStatus;
  error: string;
  onReconnect: () => void;
  onLeave: () => void;
}) {
  if (status === "online" && !error) return null;
  const text =
    error ||
    {
      connecting: "Connexion à la salle…",
      offline: "Connexion perdue. Reconnexion en cours ; la course continue.",
      closed: "Cette salle n’est plus disponible.",
      superseded: "Cette partie est active dans un autre onglet.",
      online: "",
    }[status];
  return (
    <div className="connection-notice" role="status">
      <span>{text}</span>
      {status === "superseded" && (
        <button onClick={onReconnect}>Reprendre ici</button>
      )}
      {status === "closed" && (
        <button onClick={onLeave}>Retour à l’accueil</button>
      )}
    </div>
  );
}
