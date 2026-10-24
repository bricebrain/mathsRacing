import { perspective } from "../shared/ranking";
import type { LapCount, PlayerCount } from "../engine/config";
import type { GameMode } from "../engine/questions";
import { useEffect, useRef, useState } from "react";
import { emptyRace } from "../shared/display";
import type { CarColor, DisplayRace, Phase, Session } from "../shared/protocol";
import { RaceInterpolator } from "../network/interpolation";
import { useRoom } from "./useRoom";
import { useRaceControls } from "./useRaceControls";
export function useNetworkRace(session: Session | null) {
  const room = useRoom(session);
  const [race] = useState(() => ({ current: emptyRace() }));
  const [, paint] = useState(0);
  const interpolator = useRef(new RaceInterpolator());
  const source = useRef(room);
  source.current = room;
  useEffect(() => {
    if (room.view) interpolator.current.push(room.view);
  }, [room.view]);
  useEffect(() => {
    let frame: number,
      last = 0;
    const update = (timestamp: number) => {
      const { view, clockOffset } = source.current;
      if (view) {
        const state = interpolator.current.sample(
            view,
            Date.now() + clockOffset,
          ),
          id = view.selfId;
        race.current = perspective(state, id);
      } else race.current = emptyRace();
      if (timestamp - last > 50) {
        paint((value) => value + 1);
        last = timestamp;
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [race]);
  if (room.view && room.view.phase !== "racing")
    race.current = perspective(room.view.state, room.view.selfId);
  const serverNow = Date.now() + room.clockOffset;
  const phase: Phase =
    room.view?.phase === "countdown" &&
    room.view.startsAt !== null &&
    serverNow >= room.view.startsAt
      ? "racing"
      : (room.view?.phase ?? "lobby");
  const controls = useRaceControls(room, phase);
  const self = room.view?.members.find(
      (member) => member.id === room.view?.selfId,
    ),
    opponents = room.view?.members.filter(
      (member) => member.id !== room.view?.selfId,
    ) ?? [];
  return {
    ...room,
    ...controls,
    race,
    phase,
    self,
    opponents,
    countdown: Math.max(
      1,
      Math.min(
        3,
        Math.ceil(((room.view?.startsAt ?? serverNow) - serverNow) / 1000),
      ),
    ),
    setCapacity: (capacity: PlayerCount) => room.send({ type: "capacity", capacity }),
    setLaps: (laps: LapCount) => room.send({ type: "laps", laps }),
    setTheme: (theme: GameMode, selected: boolean) => room.send({ type: "theme", theme, selected }),
    setColor: (color: string) =>
      room.send({ type: "color", color: color as CarColor }),
    ready: () => room.send({ type: "ready", ready: !self?.ready }),
    replay: () => room.send({ type: "rematch", ready: true }),
  };
}
