import Phaser from "phaser";
interface Pose {
  x: number;
  y: number;
  angle: number;
}
/** Deux effets réutilisés par voiture : une flamme et un émetteur borné. */
export class TurboEffects {
  private flame: Phaser.GameObjects.Image;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  constructor(scene: Phaser.Scene) {
    if (!scene.textures.exists("flame")) {
      const texture = scene.textures.createCanvas("flame", 96, 32)!;
      const ctx = texture.getContext();
      const gradient = ctx.createLinearGradient(0, 16, 96, 16);
      gradient.addColorStop(0, "#64ddff00");
      gradient.addColorStop(0.45, "#33bfff55");
      gradient.addColorStop(0.78, "#c4fbdf");
      gradient.addColorStop(1, "#ffffff");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.quadraticCurveTo(42, 12, 90, 3);
      ctx.quadraticCurveTo(100, 16, 90, 29);
      ctx.quadraticCurveTo(42, 20, 0, 16);
      ctx.fill();
      texture.refresh();
    }
    this.flame = scene.add
      .image(0, 0, "flame")
      .setOrigin(1, 0.5)
      .setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.emitter = scene.add
      .particles(0, 0, "glow", {
        lifespan: 330,
        frequency: 35,
        quantity: 1,
        maxParticles: 32,
        speedX: 0,
        speedY: 0,
        scale: { start: 0.45, end: 0 },
        alpha: { start: 0.7, end: 0 },
        blendMode: "ADD",
        emitting: false,
      })
      .setDepth(2);
  }
  update(pose: Pose, turbo: number, time: number, reducedMotion: boolean) {
    const rearX = pose.x - Math.cos(pose.angle) * 30,
      rearY = pose.y - Math.sin(pose.angle) * 30;
    this.flame
      .setVisible(turbo > 0.01)
      .setPosition(rearX, rearY)
      .setRotation(pose.angle);
    const flicker = reducedMotion ? 1 : 1 + Math.sin(time / 31) * 0.08;
    this.flame
      .setScale((0.38 + turbo * 0.65) * flicker, 0.36 + turbo * 0.3)
      .setAlpha(Math.min(1, turbo * 2));
    this.emitter.setPosition(rearX, rearY);
    this.emitter.emitting = turbo > 0.01 && !reducedMotion;
    this.emitter.setParticleSpeed(
      -Math.cos(pose.angle) * 70,
      -Math.sin(pose.angle) * 70,
    );
  }
}
