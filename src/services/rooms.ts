// Sessions et routes adaptées du service rooms de Pendu Battle.
import type { Session } from "../shared/protocol";
export function loadSession(code: string): Session | null {
  try {
    const session = JSON.parse(
      localStorage.getItem(`mr:session:${code}`) ?? "null",
    ) as Session | null;
    return session?.code === code &&
      typeof session.token === "string" &&
      [0, 1].includes(session.playerId)
      ? session
      : null;
  } catch {
    return null;
  }
}
export function saveSession(session: Session) {
  try {
    localStorage.setItem(`mr:session:${session.code}`, JSON.stringify(session));
  } catch {
    /* Session en mémoire conservée. */
  }
}
export function forgetSession(code: string) {
  try {
    localStorage.removeItem(`mr:session:${code}`);
  } catch {
    /* Stockage indisponible. */
  }
}
export async function enterRoom(name: string, code?: string): Promise<Session> {
  const saved = code ? loadSession(code) : null;
  if (saved) {
    const response = await fetch(`/api/rooms/${code}/session`, {
      headers: { Authorization: `Bearer ${saved.token}` },
      cache: "no-store",
    });
    if (response.ok) return saved;
    forgetSession(code!);
    if (response.status === 410)
      throw new Error("Cette salle a expiré. Crée une nouvelle partie.");
  }
  const response = await fetch(
    code ? `/api/rooms/${code}/join` : "/api/rooms",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
  );
  const body = (await response.json()) as Session & { error?: string };
  if (!response.ok)
    throw new Error(body.error ?? "Impossible de rejoindre la salle.");
  saveSession(body);
  return { code: body.code, token: body.token, playerId: body.playerId };
}
export function roomInvite(code: string) {
  const url = new URL(`/room/${code}`, location.origin);
  if (
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
    import.meta.env.VITE_DEV_LAN_HOST
  )
    url.hostname = import.meta.env.VITE_DEV_LAN_HOST;
  return url.toString();
}
export async function shareRoom(code: string) {
  const url = roomInvite(code);
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Math Racing",
        text: "Rejoins-moi pour une course de calcul mental !",
        url,
      });
      return "Invitation partagée !";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "";
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    return "Lien copié !";
  }
  return "Copie le lien affiché pour inviter ton adversaire.";
}
