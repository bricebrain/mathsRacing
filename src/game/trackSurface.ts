import type { Track } from "./track";

export interface Corner {
  /** Abscisse curviligne du sommet du virage (0..1). */
  t: number;
  /** Côté extérieur du virage : +1 = droite de la marche, -1 = gauche. */
  side: -1 | 1;
  /** Bornes du virage le long du tour. */
  from: number;
  to: number;
}
/**
 * Repère les principaux virages en mesurant la courbure le long du tour :
 * sert à placer la gravelle, les murs de pneus et les panneaux.
 */
export function findCorners(track: Track, count = 4): Corner[] {
  const N = 460;
  const pts = Array.from({ length: N }, (_, i) => track.sample(i / N));
  const raw = pts.map((p, i) => {
    const a = pts[(i - 2 + N) % N],
      b = pts[(i + 2) % N];
    return Math.atan2(
      Math.sin(b.angle - a.angle),
      Math.cos(b.angle - a.angle),
    );
  });
  const curv = raw.map((_, i) => {
    let sum = 0;
    for (let k = -3; k <= 3; k++) sum += raw[(i + k + N) % N];
    return sum / 7;
  });
  const strength = curv.map((_, i) => {
    let sum = 0;
    for (let k = -12; k <= 12; k++) sum += Math.abs(curv[(i + k + N) % N]);
    return sum;
  });
  const candidates = [];
  for (let i = 0; i < N; i++) {
    const magnitude = Math.abs(curv[i]);
    if (
      magnitude > 0.06 &&
      magnitude >= Math.abs(curv[(i - 1 + N) % N]) &&
      magnitude > Math.abs(curv[(i + 1) % N])
    )
      candidates.push({ i, strength: strength[i] });
  }
  candidates.sort((a, b) => b.strength - a.strength);
  const picked: typeof candidates = [];
  for (const candidate of candidates) {
    if (picked.length >= count) break;
    const spread = picked.every(
      (p) =>
        Math.min(
          Math.abs(candidate.i - p.i),
          N - Math.abs(candidate.i - p.i),
        ) >
        0.13 * N,
    );
    if (spread) picked.push(candidate);
  }
  return picked.map(({ i }) => {
    const sign = Math.sign(curv[i]) || 1;
    let a = i,
      b = i;
    const floor = Math.max(0.05, Math.abs(curv[i]) * 0.35);
    while (a > i - 40 && Math.abs(curv[(a - 1 + N) % N]) > floor) a--;
    while (b < i + 40 && Math.abs(curv[(b + 1) % N]) > floor) b++;
    return {
      t: i / N,
      side: (sign > 0 ? -1 : 1) as -1 | 1,
      from: (a - 4) / N,
      to: (b + 4) / N,
    };
  });
}

/** Les ombres et l'éclairage sont peints une fois, sans filtres GPU pendant la course. */
export function drawTrackSurface(
  ctx: CanvasRenderingContext2D,
  track: Track,
  random: () => number,
) {
  const path = new Path2D();
  track.raw.forEach((point, i) =>
    i ? path.lineTo(point.x, point.y) : path.moveTo(point.x, point.y),
  );
  path.closePath();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.save();
  ctx.translate(8, 12);
  ctx.strokeStyle = "#10261f55";
  ctx.lineWidth = 132;
  ctx.shadowColor = "#10261f60";
  ctx.shadowBlur = 14;
  ctx.stroke(path);
  ctx.restore();
  // Accotement herbeux, puis bourrelet sombre, liseré clair et bande crème.
  ctx.strokeStyle = "#7f8c67";
  ctx.lineWidth = 120;
  ctx.stroke(path);
  ctx.strokeStyle = "#263e35";
  ctx.lineWidth = 110;
  ctx.stroke(path);
  ctx.strokeStyle = "#c2c6aa";
  ctx.lineWidth = 101;
  ctx.stroke(path);
  ctx.strokeStyle = "#ece7d2";
  ctx.lineWidth = 92;
  ctx.stroke(path);
  // Vibreurs : pilules rouges alternant avec la bande crème sur tout le tour.
  ctx.lineCap = "butt";
  ctx.setLineDash([17, 17]);
  ctx.strokeStyle = "#cf4536";
  ctx.lineWidth = 92;
  ctx.stroke(path);
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  // Asphalte : dégradé traversant puis marbrures et grain pour casser le plat.
  const asphalt = ctx.createLinearGradient(0, 0, 260, 640);
  asphalt.addColorStop(0, "#4a5a60");
  asphalt.addColorStop(0.5, "#37474d");
  asphalt.addColorStop(1, "#2a393f");
  ctx.lineWidth = 74;
  ctx.strokeStyle = asphalt;
  ctx.stroke(path);
  ctx.lineWidth = 68;
  ctx.strokeStyle = "#ddd8c2";
  ctx.stroke(path);
  ctx.lineWidth = 66;
  ctx.strokeStyle = asphalt;
  ctx.stroke(path);
  for (let i = 0; i < 12500; i++) {
    const x = random() * 1000,
      y = random() * 640;
    ctx.lineWidth = 72;
    if (ctx.isPointInStroke(path, x, y)) {
      ctx.fillStyle = random() > 0.5 ? "#afbbc70e" : "#00000017";
      ctx.fillRect(x, y, 1.5, 1);
    }
  }
  for (let i = 0; i < 240; i++) {
    const x = random() * 1000,
      y = random() * 640;
    ctx.lineWidth = 66;
    if (ctx.isPointInStroke(path, x, y)) {
      ctx.fillStyle = random() > 0.5 ? "#ffffff08" : "#0000000d";
      ctx.beginPath();
      ctx.arc(x, y, 5 + random() * 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Deux fines bandes de gomme suivent le même tracé et renforcent le volume de la piste.
  for (const offset of [-15, 15]) {
    ctx.beginPath();
    for (let i = 0; i <= 700; i++) {
      const p = track.sample(i / 700, offset);
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
    ctx.strokeStyle = "#12212724";
    ctx.lineWidth = 9;
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e7eadc80";
  ctx.setLineDash([12, 17]);
  ctx.stroke(path);
  ctx.setLineDash([]);
  // Ligne d'arrivée : damier pleine largeur + grille de départ hachurée.
  const start = track.sample(0);
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(start.angle);
  ctx.fillStyle = "#e8e4d0";
  ctx.fillRect(-26, -37, 5, 74);
  for (let col = 0; col < 5; col++)
    for (let row = 0; row < 8; row++) {
      ctx.fillStyle = (row + col) % 2 ? "#263139" : "#f1eee2";
      ctx.fillRect(col * 7 - 17, row * 9 - 36, 7, 9);
    }
  for (const lane of [-1, 1]) {
    ctx.strokeStyle = "#dfe7d6b3";
    ctx.lineWidth = 2;
    ctx.strokeRect(-67, lane * 17 - 12, 35, 24);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-67, lane * 17 - 12, 35, 24);
    ctx.clip();
    ctx.strokeStyle = "#dfe7d640";
    for (let i = -70; i < -28; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, lane * 17 - 14);
      ctx.lineTo(i + 12, lane * 17 + 14);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  // Bacs de gravier à l'extérieur des principaux virages.
  const corners = findCorners(track);
  for (const corner of corners) {
    const gravel = new Path2D();
    let first = true;
    for (let t = corner.from; t <= corner.to; t += 0.0025) {
      const p = track.sample(t, corner.side * 56);
      if (first) {
        gravel.moveTo(p.x, p.y);
        first = false;
      } else gravel.lineTo(p.x, p.y);
    }
    ctx.lineCap = "round";
    ctx.strokeStyle = "#cdb58278";
    ctx.lineWidth = 18;
    ctx.stroke(gravel);
    ctx.strokeStyle = "#b59a6630";
    ctx.lineWidth = 18;
    ctx.stroke(gravel);
    for (let i = 0; i < 140; i++) {
      const t = corner.from + random() * (corner.to - corner.from);
      const p = track.sample(t, corner.side * (47 + random() * 18));
      ctx.fillStyle = random() > 0.5 ? "#b3986355" : "#e6d4a455";
      ctx.fillRect(p.x, p.y, 1.6, 1.2);
    }
    ctx.beginPath();
    first = true;
    for (let t = corner.from; t <= corner.to; t += 0.004) {
      const p = track.sample(t, corner.side * 47);
      if (first) {
        ctx.moveTo(p.x, p.y);
        first = false;
      } else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "#a88c5840";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Glissières et potelets sur deux portions, sans encombrer les virages serrés.
  for (const [from, to, side] of [
    [0.06, 0.28, 1],
    [0.64, 0.75, -1],
  ]) {
    ctx.beginPath();
    for (let t = from; t < to; t += 0.002) {
      const p = track.sample(t, side * 65);
      if (t === from) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "#172e32";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = "#a5b8ac";
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let t = from; t < to; t += 0.012) {
      const p = track.sample(t, side * 65);
      ctx.fillStyle = "#dbe0cb";
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
  }
  return path;
}
