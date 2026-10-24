import Phaser from "phaser";
import { laneOffset } from "./lanes";
import { RACE, CAR_COLORS } from "../engine/config";
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
  colors: string[];
  ids: PlayerId[];
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
    CAR_COLORS.forEach((color, i) => {
      createCarTexture(this, `car${i}`, Phaser.Display.Color.HexStringToColor(color).color);
      this.effects.push(new TurboEffects(this));
      this.shadows.push(
        this.add.image(0, 0, "car-shadow").setScale(0.82).setDepth(1),
      );
      this.cars.push(
        this.add.image(0, 0, `car${i}`).setScale(0.415).setDepth(3),
      );
      this.labels.push(
        this.add
          .text(0, 0, String(i + 1).padStart(2, "0"), {
            fontFamily: "Arial",
            fontSize: "14px",
            color,
            backgroundColor: "#172830",
            padding: { x: 6, y: 3 },
          })
          .setOrigin(0.5)
          .setDepth(8),
      );
    });

  }
  update() {
    const { state, colors, ids, active } = this.read();
    if (this.carColor !== colors.join()) {
      this.carColor = colors.join();
      colors.forEach((color, index) => {
        const key = `car-${color}`;
        createCarTexture(this, key, Phaser.Display.Color.HexStringToColor(color).color);
        this.cars[index].setTexture(key);
        this.labels[index].setColor(color);
      });
    }
    this.cars.forEach((car, index) => {
      const visible = index < state.players.length;
      car.setVisible(visible);
      this.labels[index].setVisible(visible);
      this.shadows[index].setVisible(visible);
      this.effects[index].setVisible(visible);
    });
    state.players.forEach((p, i) => {
      const pos = this.track.sample(
        p.distance / RACE.lapLength,
        laneOffset(ids[i], state.players.length),
      );
      const turbo = active && p.eliminatedAt == null ? boostAt(p, state.time) : 0;
      // Sur le pont, la voiture passe au-dessus du calque ; dessous, elle disparaît
      // sous le tablier.
      const t = (((p.distance / RACE.lapLength) % 1) + 1) % 1;
      const elevated =
        !!this.bridge && t >= this.bridge.from && t <= this.bridge.to;
      this.cars[i].setDepth(elevated ? 6 : 3);
      this.shadows[i].setDepth(elevated ? 4.5 : 1);
      this.effects[i].setDepth(elevated ? 5.5 : 2);
      this.cars[i].setPosition(pos.x, pos.y).setRotation(pos.angle).setAlpha(p.eliminatedAt == null ? 1 : 0.4);
      this.labels[i]
        .setPosition(pos.x, pos.y - 31)
        .setText(String(ids[i] + 1).padStart(2, "0"));
      this.shadows[i].setPosition(pos.x + 5, pos.y + 8).setRotation(pos.angle);
      this.effects[i].update(pos, turbo, this.time.now, this.reducedMotion);
    });
  }
}
