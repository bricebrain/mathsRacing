import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActionResult,
  ClientAction,
  RoomView,
  Session,
} from "../shared/protocol";
import {
  RoomConnection,
  type ConnectionStatus,
} from "../network/RoomConnection";
export function useRoom(session: Session | null) {
  const [view, setView] = useState<RoomView | null>(null),
    [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState(""),
    [ack, setAck] = useState<ActionResult | null>(null),
    [clockOffset, setClockOffset] = useState(0);
  const owner = useRef<RoomConnection>();
  useEffect(() => {
    setView(null);
    setAck(null);
    setError("");
    if (!session) return;
    let bestRtt = Infinity,
      received = false;
    const connection = new RoomConnection(
      session,
      (message) => {
        if (message.type === "room.state") {
          if (!received) {
            received = true;
            setError("");
            setClockOffset(message.view.serverTime - Date.now());
          }
          setView((current) =>
            !current || message.view.revision >= current.revision
              ? message.view
              : current,
          );
        } else if (message.type === "pong") {
          const rtt = Date.now() - message.sentAt;
          if (rtt <= bestRtt + 10) {
            bestRtt = Math.min(rtt, bestRtt);
            setClockOffset(
              message.serverTime - (message.sentAt + Date.now()) / 2,
            );
          }
        } else if (message.type === "action.result") setAck(message);
        else if (message.type === "error") setError(message.message);
      },
      setConnection,
    );
    owner.current = connection;
    connection.start();
    return () => connection.stop();
  }, [session?.code, session?.token]);
  const send = useCallback((action: ClientAction) => {
    setError("");
    return owner.current?.send(action) ?? false;
  }, []);
  return {
    view,
    connection,
    error,
    ack,
    clockOffset,
    send,
    reconnect: () => owner.current?.reconnect(),
  };
}
