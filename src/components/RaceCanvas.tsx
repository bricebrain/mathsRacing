import { useEffect, useRef } from "react";
import type { RenderSource } from "../game/RacingScene";
export function RaceCanvas({ source }: { source: RenderSource }) {
  const parent = useRef<HTMLDivElement>(null),
    current = useRef(source);
  current.current = source;
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let game: import("phaser").Game | undefined;
    Promise.all([import("phaser"), import("../game/RacingScene")]).then(
      ([{ default: Phaser }, { RacingScene }]) => {
        if (cancelled || !parent.current) return;
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: parent.current,
          backgroundColor: "#426d55",
          width: 1000,
          height: 640,
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: { antialias: true, roundPixels: false },
          fps: { target: 60 },
          scene: new RacingScene(() => current.current),
          audio: { noAudio: true },
        });
        observer = new ResizeObserver(() => game?.scale.refresh());
        observer.observe(parent.current);
      },
    );
    return () => {
      cancelled = true;
      observer?.disconnect();
      game?.destroy(true);
    };
  }, []);
  return <div className="race-canvas" ref={parent} role="img"
    aria-label={`Circuit Les Pins : ${source.state.players.length} voitures vues du dessus`}
    data-player-count={source.state.players.length} />;
}
