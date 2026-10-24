import { useEffect, useState } from "react";
import { enterRoom, loadSession } from "../services/rooms";
import type { Session } from "../shared/protocol";
export function invitationCode() {
  return location.pathname.match(/^\/room\/([A-Z2-9]{6})$/)?.[1] ?? "";
}
export function useSession() {
  const [session, setSession] = useState<Session | null>(() =>
    loadSession(invitationCode()),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [invite, setInvite] = useState(invitationCode);
  useEffect(() => {
    const navigate = () => {
      const code = invitationCode();
      setInvite(code);
      setSession(loadSession(code));
    };
    window.addEventListener("popstate", navigate);
    return () => window.removeEventListener("popstate", navigate);
  }, []);
  const enter = async (name: string, code?: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const session = await enterRoom(name, code);
      history.pushState(null, "", `/room/${session.code}`);
      setSession(session);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Connexion impossible. Réessaie.",
      );
    } finally {
      setBusy(false);
    }
  };
  return {
    session,
    busy,
    error,
    invite,
    enter,
    leave: () => {
      history.pushState(null, "", "/");
      setInvite("");
      setSession(null);
      setError("");
    },
  };
}
