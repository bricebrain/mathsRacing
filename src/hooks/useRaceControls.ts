import { isChoice } from "../engine/questions";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Phase } from "../shared/protocol";
import { createActionId } from "../utils/actionId";
import type { useRoom } from "./useRoom";
export function useRaceControls(
  room: ReturnType<typeof useRoom>,
  phase: Phase,
) {
  const [input, setInput] = useState(""),
    [feedback, setFeedback] = useState(""),
    [pending, setPending] = useState(false);
  const action = useRef<string | null>(null);
  const available =
    phase === "racing" &&
    room.connection === "online" &&
    !!room.view?.question &&
    !pending &&
    !room.view?.correction;
  useEffect(() => {
    setInput("");
    setFeedback("");
    setPending(false);
    action.current = null;
  }, [room.view?.raceId]);
  useEffect(() => {
    if (!room.ack || room.ack.actionId !== action.current) return;
    setPending(false);
    action.current = null;
    setFeedback(room.ack.status);
    if (room.ack.status !== "ignored") setInput("");
    const timer = setTimeout(() => setFeedback(""), 900);
    return () => clearTimeout(timer);
  }, [room.ack]);
  const submit = useCallback(
    (type: "answer" | "skip", choice?: string) => {
      const view = room.view;
      const value = choice ?? input;
      if (
        !available ||
        !view?.question ||
        !view.raceId ||
        action.current ||
        (type === "answer" && !value)
      )
        return;
      const actionId = createActionId();
      const base = {
        actionId,
        raceId: view.raceId,
        operationId: view.question.id,
      };
      if (
        room.send(
          type === "answer"
            ? { type, ...base, value }
            : { type, ...base },
        )
      ) {
        action.current = actionId;
        setPending(true);
        setFeedback("pending");
      }
    },
    [available, room.view, room.send, input],
  );
  const key = useCallback(
    (value: string) => {
      if (!available) return;
      if (room.view?.question && isChoice(room.view.question)) {
        if (/^[1-4]$/.test(value)) submit("answer", String(Number(value) - 1));
        return;
      }
      if (value === "OK") submit("answer");
      else if (value === "⌫") setInput((current) => current.slice(0, -1));
      else if (/^\d$/.test(value))
        setInput((current) => (current.length < 3 ? current + value : current));
    },
    [available, submit, room.view?.question],
  );
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        !available ||
        event.target instanceof HTMLInputElement
      )
        return;
      if (room.view?.question && isChoice(room.view.question) &&
        !/^[1-4]$/.test(event.key)) return;
      const control =
        event.target instanceof HTMLElement &&
        event.target.closest(".skip-button,.sound-toggle");
      if (event.key === "Enter" && control) return;
      if (
        /^\d$/.test(event.key) ||
        ["Enter", "Backspace"].includes(event.key)
      ) {
        event.preventDefault();
        if (
          /^\d$/.test(event.key) &&
          control &&
          event.target instanceof HTMLElement
        )
          event.target.blur();
        key(
          event.key === "Enter"
            ? "OK"
            : event.key === "Backspace"
              ? "⌫"
              : event.key,
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [available, key, room.view?.question]);
  return {
    input,
    feedback,
    pending,
    key,
    choose: (index: number) => {
      if (room.view?.question && isChoice(room.view.question) &&
        Number.isInteger(index) && index >= 0 && index < 4)
        submit("answer", String(index));
    },
    skip: () => submit("skip"),
    active: available,
  };
}
