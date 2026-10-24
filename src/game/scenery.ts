import Phaser from "phaser";
import { WORLD, type Track } from "./track";
import {
  drawBridgeDeck,
  drawTrackSurface,
  findBridge,
  findCorners,
  findStraits,
  trackClearance,
} from "./trackSurface";
export function createScenery(scene: Phaser.Scene, track: Track) {
  const texture = scene.textures.createCanvas(
    "circuit",
    WORLD.width,
    WORLD.height,
  )!;
  const ctx = texture.getContext();
  let seed = 42;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 429497296;
  };
  const sprite = (key: string) =>
    scene.textures.exists(key)
      ? (scene.textures.get(key).getSourceImage() as CanvasImageSource)
      : null;
  const drawSprite = (
    img: CanvasImageSource,
    x: number,
    y: number,
    scale: number,
    rotation = 0,
    flip = false,
  ) => {
    const w = (img as HTMLImageElement).width,
      h = (img as HTMLImageElement).height;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.drawImage(img, -w / 2, -h / 2);
    ctx.restore();
  };
  const grass = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  grass.addColorStop(0, "#688565");
  grass.addColorStop(0.5, "#4c7357");
  grass.addColorStop(1, "#345743");
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let y = 0; y < 640; y += 55) {
    ctx.fillStyle = "#ffffff04";
    ctx.fillRect(0, y, 1000, 27);
  }
  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = random() > 0.5 ? "#b4d18e14" : "#152e2520";
    ctx.fillRect(random() * 1000, random() * 640, random() * 3 + 1, 1);
  }

  // Herbe : taches sèches et fleurs éparses, peintes sous la piste.
  const path0 = new Path2D();
  track.raw.forEach((point, i) =>
    i ? path0.lineTo(point.x, point.y) : path0.moveTo(point.x, point.y),
  );
  path0.closePath();
  ctx.lineWidth = 130;
  for (let i = 0; i < 14; i++) {
    const x = random() * 1000,
      y = random() * 640;
    if (!ctx.isPointInStroke(path0, x, y)) {
      const dry = ctx.createRadialGradient(x, y, 2, x, y, 14 + random() * 22);
      dry.addColorStop(0, "#b9a76b30");
      dry.addColorStop(1, "#b9a76b00");
      ctx.fillStyle = dry;
      ctx.beginPath();
      ctx.ellipse(x, y, 14 + random() * 22, 10 + random() * 14, random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let i = 0; i < 90; i++) {
    const x = random() * 1000,
      y = random() * 640;
    if (!ctx.isPointInStroke(path0, x, y)) {
      ctx.fillStyle = ["#e8e2c0a8", "#d9d0efa8", "#f0e6a8a8"][i % 3];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const path = drawTrackSurface(ctx, track, random);

  // Murs de pneus à l'extérieur des virages, sauf où des glissières existent
  // ou où une autre portion de piste passe à proximité.
  const corners = findCorners(track);
  const straits = findStraits(track);
  const clear = trackClearance(track);
  const inRange = (t: number, from: number, to: number) =>
    (t >= from && t <= to) || (to > 1 && t + 1 >= from && t + 1 <= to);
  const railed = (t: number, side: number) =>
    straits.some((s) => s.side === side && inRange(t, s.from - 0.02, s.to + 0.02));
  const tiresRed = sprite("asset-tires-red"),
    tiresWhite = sprite("asset-tires-white");
  if (tiresRed && tiresWhite)
    for (const corner of corners) {
      if (railed(corner.t, corner.side)) continue;
      for (let k = 0; k < 5; k++) {
        const t = corner.t - 0.018 + k * 0.013;
        const p = track.sample(t, corner.side * 70);
        if (!clear(t, p.x, p.y, 74)) continue;
        ctx.fillStyle = "#0e1f1a38";
        ctx.beginPath();
        ctx.ellipse(p.x + 3, p.y + 4, 15, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        drawSprite(k % 2 ? tiresWhite : tiresRed, p.x, p.y, 0.55, random() * 6);
      }
    }

  // Panneaux chevron annonçant les virages sans mur de pneus, en retrait de la piste.
  const arrow = sprite("asset-arrow");
  if (arrow)
    for (const corner of corners.slice(0, 3)) {
      if (railed(corner.t, corner.side)) continue;
      for (const [t, scale] of [
        [corner.t - 0.055, 0.3],
        [corner.t - 0.034, 0.34],
      ] as const) {
        const p = track.sample(t, corner.side * 80);
        if (!clear(t, p.x, p.y, 80)) continue;
        const q = track.sample(t + 0.01, corner.side * 80);
        const forward = Math.atan2(q.y - p.y, q.x - p.x);
        drawSprite(
          arrow,
          p.x,
          p.y,
          scale,
          forward + (corner.side === 1 ? Math.PI : 0),
          corner.side === 1,
        );
      }
    }

  // Panneaux de distance 100 m / 50 m plantés à l'approche des virages.
  for (const corner of corners) {
    if (railed(corner.t, corner.side)) continue;
    for (const [dt, label] of [
      [0.075, "100"],
      [0.04, "50"],
    ] as const) {
      const p = track.sample(corner.t - dt, corner.side * 72);
      if (!clear(corner.t - dt, p.x, p.y, 78)) continue;
      ctx.fillStyle = "#0e1f1a30";
      ctx.beginPath();
      ctx.ellipse(p.x + 2, p.y + 3, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f4f1e4";
      ctx.beginPath();
      ctx.roundRect(p.x - 10, p.y - 9, 20, 18, 3);
      ctx.fill();
      ctx.strokeStyle = "#cf4536";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#cf4536";
      ctx.beginPath();
      ctx.moveTo(p.x - 9, p.y - 8);
      ctx.lineTo(p.x - 1, p.y - 8);
      ctx.lineTo(p.x - 9, p.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1c2620";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, p.x + 1, p.y + 3.5);
    }
  }

  // Arche de départ : piliers et poutre damier au-dessus de la ligne d'arrivée.
  const gate = track.sample(0);
  ctx.save();
  ctx.translate(gate.x, gate.y);
  ctx.rotate(gate.angle);
  // L'arche se plante juste après la bande damier peinte (large de 35 px).
  ctx.translate(20, 0);
  ctx.fillStyle = "#0a161c22";
  ctx.fillRect(-7, -46, 10, 92);
  ctx.fillStyle = "#1a222b";
  ctx.beginPath();
  ctx.roundRect(-4, -58, 8, 13, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-4, 45, 8, 13, 2);
  ctx.fill();
  ctx.fillStyle = "#22303a";
  ctx.beginPath();
  ctx.roundRect(-4, -46, 8, 92, 3);
  ctx.fill();
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 2; col++) {
      ctx.fillStyle = (row + col) % 2 ? "#f1eee2" : "#263139";
      ctx.fillRect(-4 + col * 4, -46 + (row * 92) / 12, 4, 92 / 12);
    }
  ctx.strokeStyle = "#101920";
  ctx.lineWidth = 1;
  ctx.strokeRect(-4, -46, 8, 92);
  ctx.restore();

  // Arbres du pack Kenney, posés avec une ombre portée et une rotation variée.
  const treeLarge = sprite("asset-tree-large"),
    treeSmall = sprite("asset-tree-small");
  ctx.lineWidth = 175;
  const blocked = (x: number, y: number) =>
    ctx.isPointInStroke(path, x, y) ||
    (x > 155 && x < 405 && y > 185 && y < 315) ||
    (x > 240 && x < 470 && y > 595);
  let planted = 0;
  for (let i = 0; i < 400 && planted < 62; i++) {
    const x = random() * 980 + 10,
      y = random() * 620 + 10;
    if (blocked(x, y)) continue;
    const large = random() > 0.42;
    const img = large ? treeLarge : treeSmall;
    if (!img) break;
    const scale = large ? 0.28 + random() * 0.13 : 0.36 + random() * 0.14;
    const radius = ((large ? 214 : 141) * scale) / 2;
    // Marge au bord du cadre pour ne jamais couper la canopée.
    if (x < radius + 4 || x > 996 - radius || y < radius + 4 || y > 636 - radius)
      continue;
    ctx.fillStyle = "#0e241c48";
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.5, y + radius * 0.55, radius * 0.95, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(img, x, y, scale, Math.floor(random() * 4) * (Math.PI / 2), random() > 0.5);
    planted++;
  }

  // Tribune : sprite avec spectateurs, repliée dans le haut de l'intérieur.
  const tribune = sprite("asset-tribune");
  if (tribune) {
    ctx.save();
    ctx.translate(280, 250);
    ctx.rotate(-0.05);
    ctx.fillStyle = "#172d2c40";
    ctx.beginPath();
    ctx.roundRect(-122, -58, 244, 128, 8);
    ctx.fill();
    ctx.restore();
    drawSprite(tribune, 280, 250, 0.54, -0.05);
  }

  // Pit lane : béton, places délimitées, cônes et panneau.
  ctx.fillStyle = "#3b5449";
  ctx.fillRect(268, 604, 172, 30);
  ctx.fillStyle = "#d5cfba";
  ctx.fillRect(268, 606, 172, 24);
  ctx.strokeStyle = "#ffffff45";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) ctx.strokeRect(274 + i * 41, 610, 36, 16);
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#2e4438";
  ctx.fillText("PIT LANE", 354, 637);
  const cone = sprite("asset-cone");
  if (cone) {
    drawSprite(cone, 258, 616, 0.4, 0.25);
    drawSprite(cone, 452, 616, 0.4, -0.25, true);
  }

  // Paddock : deux tentes derrière la tribune.
  const tentRed = sprite("asset-tent-red"),
    tentBlue = sprite("asset-tent-blue");
  if (tentRed && tentBlue) {
    for (const [img, x] of [
      [tentRed, 236],
      [tentBlue, 350],
    ] as const) {
      ctx.fillStyle = "#172d2c35";
      ctx.beginPath();
      ctx.ellipse(x + 8, 452, 34, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(img, x, 440, 0.26, 0.08);
    }
  }

  // Calque du pont au-dessus des voitures : elles passent dessous.
  const bridge = findBridge(track);
  if (bridge) {
    const deck = scene.textures.createCanvas(
      "bridge-deck",
      WORLD.width,
      WORLD.height,
    )!;
    drawBridgeDeck(deck.getContext(), track, bridge);
    deck.refresh();
    scene.add.image(0, 0, "bridge-deck").setOrigin(0).setDepth(5);
  }

  // Vignette discrète pour donner de la profondeur à la scène.
  const vignette = ctx.createRadialGradient(500, 320, 240, 500, 320, 620);
  vignette.addColorStop(0, "#00000000");
  vignette.addColorStop(1, "#0a171212");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  texture.refresh();
  scene.add.image(0, 0, "circuit").setOrigin(0);
}
