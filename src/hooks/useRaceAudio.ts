import { useEffect, useRef, useState } from "react";
import { RaceAudio } from "../audio/RaceAudio";
import type { DisplayRace, Phase } from "../shared/protocol";
export function useRaceAudio(
  race: { current: DisplayRace },
  phase: Phase,
  countdown: number,
) {
  const service = useRef<RaceAudio>();
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("math-racing-sound") !== "off";
    } catch {
      return true;
    }
  });
  const [available, setAvailable] = useState(true);
  // Le service est recréé par le montage d'effet de StrictMode, sans créer de contexte avant un geste.
  useEffect(() => {
    const audio = new RaceAudio();
    service.current = audio;
    const visibility = () =>
      audio.setVisible(document.visibilityState === "visible");
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      audio.destroy();
    };
  }, []);
  useEffect(() => {
    service.current?.setEnabled(enabled);
  }, [enabled]);
  useEffect(() => {
    service.current?.setPhase(phase);
    if (phase === "countdown") service.current?.countdown(countdown);
    if (phase === "racing") service.current?.countdown(0);
    if (phase === "finished")
      service.current?.finish(race.current.winner === 0);
  }, [phase, countdown, race]);
  useEffect(() => {
    const audio = service.current;
    if (!audio) return;
    let frame: number,
      lastAt = 0;
    const initial = race.current.players[0];
    let correct = race.current.players.map((player) => player.correct),
      errors = initial.errors,
      skipped = initial.skipped;
    let lead = 0;
    const update = (now: number) => {
      if (now - lastAt > 45) {
        lastAt = now;
        const state = race.current,
          player = state.players[0];
        if (phase === "racing") {
          state.players.forEach((p, i) => {
            if (p.correct > correct[i]) audio.correct(i);
          });
          if (player.errors > errors) audio.wrong();
          if (player.skipped > skipped) audio.skip();
          const gap = player.distance - state.players[1].distance;
          const nextLead = Math.abs(gap) > 5 ? Math.sign(gap) : lead;
          if (lead && nextLead !== lead) audio.overtake();
          lead = nextLead;
          correct = state.players.map((p) => p.correct);
          errors = player.errors;
          skipped = player.skipped;
        }
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [phase, race]);
  const unlock = () => {
    service.current?.setEnabled(enabled);
    if (enabled) void service.current?.unlock().then(setAvailable);
  };
  useEffect(() => {
    if (phase !== "lobby" || !enabled) return;
    const activate = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        (event.repeat ||
          ["Shift", "Control", "Alt", "Meta"].includes(event.key))
      )
        return;
      void service.current?.unlock().then(setAvailable);
    };
    document.addEventListener("pointerdown", activate, { once: true });
    document.addEventListener("keydown", activate);
    return () => {
      document.removeEventListener("pointerdown", activate);
      document.removeEventListener("keydown", activate);
    };
  }, [phase, enabled]);
  const toggle = () => {
    if (enabled && !available) {
      unlock();
      return;
    }
    const next = !enabled;
    setEnabled(next);
    service.current?.setEnabled(next);
    try {
      localStorage.setItem("math-racing-sound", next ? "on" : "off");
    } catch {
      /* Préférence facultative. */
    }
    if (next) void service.current?.unlock().then(setAvailable);
  };
  return { enabled, available, unlock, toggle };
}
