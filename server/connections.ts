// Adapté du mécanisme de reprise de connexion de Pendu Battle.
import { timingSafeEqual } from "node:crypto";
import type { PlayerId } from "../src/shared/protocol";
export interface Attachment {
  playerId: PlayerId | null;
  clientId?: string;
  openedAt: number;
  lastAt: number;
  count: number;
  windowAt: number;
}
export function claimConnection(
  sockets: WebSocket[],
  current: WebSocket,
  playerId: PlayerId,
  takeover: boolean,
  clientId: string,
): boolean {
  const active = sockets.filter(
    (socket) =>
      socket !== current &&
      socket.readyState === 1 &&
      (socket.deserializeAttachment() as Attachment).playerId === playerId,
  );
  if (
    active.some(
      (socket) =>
        (socket.deserializeAttachment() as Attachment).clientId !== clientId,
    ) &&
    !takeover
  ) {
    current.close(4002, "Cette partie est active dans un autre onglet.");
    return false;
  }
  for (const old of active) {
    old.serializeAttachment({
      ...(old.deserializeAttachment() as Attachment),
      playerId: null,
    });
    old.close(4002, "La partie a été reprise dans un autre onglet.");
  }
  return true;
}
export function secureTokenEquals(left: string, right: string) {
  const encoder = new TextEncoder(),
    a = encoder.encode(left),
    b = encoder.encode(right);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}
