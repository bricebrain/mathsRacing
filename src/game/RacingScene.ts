import Phaser from "phaser";
import { RACE } from "../engine/config";
import { boostAt } from "../engine/race";
import type { DisplayRace, PlayerId } from "../shared/protocol";
import { createTrack } from "./track";
import { findBridge, type Bridge } from "./trackSurface";
import { createScenery } from "./scenery";
import {
  createCarTexture,
  createGlowTexture,
  createShadowTexture,
} from "./textures";
import { SCENERY_ASSETS } from "./assets";
import { TurboEffects } from "./TurboEffects";
export interface RenderSource {
  state: DisplayRace;
  colors: [string, string];
  ids: [PlayerId, PlayerId];
  active: boolean;
}
export class RacingScene extends Phaser.Scene {
  private track = createTrack();
  private cars: Phaser.GameObjects.Image[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private effects: TurboEffects[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  private carColor = "";
  private bridge: Bridge | null = null;
  constructor(private read: () => RenderSource) {
    super("race");
  }
  preload() {
    for (const [key, url] of Object.entries(SCENERY_ASSETS))
      this.load.image(key, url);
  }
  create() {
    this.bridge = findBridge(this.track);
    createScenery(this, this.track);
    createGlowTexture(this);
    createShadowTexture(this);
    [0xb5ef63, 0xff967b].forEach((color, i) => {
      createCarTexture(this, `car${i}`, color);
      this.effects.push(new TurboEffects(this));
      this.shadows.push(
        this.add.image(0, 0, "car-shadow").setScale(0.82).setDepth(1),
      );
      this.cars.push(
        this.add.image(0, 0, `car${i}`).setScale(0.415).setDepth(3),
      );
      this.labels.push(
        this.add
          .text(0, 0, i ? "02" : "01", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: i ? "#ffd0bc" : "#d3ff9e",
            backgroundColor: "#172830",
            padding: { x: 6, y: 3 },
          })
          .setOrigin(0.5)
          .setDepth(8),
      );
    });
    this.game.canvas.setAttribute(
      "aria-label",
      "Circuit Les Pins : deux voitures vues du dessus sur une piste fermée",
    );
    // Sonde temporaire de diagnostic (retirée après vérification).
    this.game.canvas.setAttribute(
      "data-bridge",
      JSON.stringify(this.bridge),
    );
    this.game.canvas.setAttribute("role", "img");
  }
  update() {
    const { state, colors, ids, active } = this.read();
    if (this.carColor !== colors.join()) {
      this.carColor = colors.join();
      const color = colors[0];
      const key = `car-${color}`;
      createCarTexture(
        this,
        key,
        Phaser.Display.Color.HexStringToColor(color).color,
      );
      this.cars[0].setTexture(key);
      const opponent = colors[1];
      const opponentKey = `car-${opponent}`;
      createCarTexture(
        this,
        opponentKey,
        Phaser.Display.Color.HexStringToColor(opponent).color,
      );
      this.cars[1].setTexture(opponentKey);
    }
    state.players.forEach((p, i) => {
      const pos = this.track.sample(
        p.distance / RACE.lapLength,
        ids[i] === 1 ? -17 : 17,
      );
      const turbo = active ? boostAt(p, state.time) : 0;
      // Sur le pont, la voiture passe au-dessus du calque ; dessous, elle disparaît
      // sous le tablier.
      const t = (((p.distance / RACE.lapLength) % 1) + 1) % 1;
      const elevated =
        !!this.bridge && t >= this.bridge.from && t <= this.bridge.to;
      this.cars[i].setDepth(elevated ? 6 : 3);
      this.shadows[i].setDepth(elevated ? 4.5 : 1);
      this.effects[i].setDepth(elevated ? 5.5 : 2);
      this.cars[i].setPosition(pos.x, pos.y).setRotation(pos.angle);
      this.labels[i]
        .setPosition(pos.x, pos.y - 31)
        .setText(ids[i] === 0 ? "01" : "02");
      this.shadows[i].setPosition(pos.x + 5, pos.y + 8).setRotation(pos.angle);
      this.effects[i].update(pos, turbo, this.time.now, this.reducedMotion);
    });
  }
}
