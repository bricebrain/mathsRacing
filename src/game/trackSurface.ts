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

export interface Strait {
  from: number;
  to: number;
  side: -1 | 1;
}
/**
 * Teste le dégagement d'un point par rapport à toutes les portions de piste,
 * en ignorant le voisinage du point t lui-même. Sert à ne jamais poser de
 * décor ou de glissière sur une autre portion du circuit.
 */
export function trackClearance(track: Track) {
  const pts = Array.from({ length: 240 }, (_, i) => track.sample(i / 240));
  return (t: number, x: number, y: number, minDist: number) => {
    for (let j = 0; j < pts.length; j++) {
      let dt = Math.abs(j / pts.length - t);
      dt = Math.min(dt, 1 - dt);
      if (dt < 0.035) continue;
      if (Math.hypot(pts[j].x - x, pts[j].y - y) < minDist) return false;
    }
    return true;
  };
}
/** Repère les plus longues lignes droites du tour pour y poser les glissières. */
export function findStraits(track: Track, count = 2): Strait[] {
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
  const flat = raw.map((_, i) => {
    let sum = 0;
    for (let k = -3; k <= 3; k++)
      sum += Math.abs(raw[(i + k + N) % N] / 7);
    return sum < 0.05;
  });
  // Rotation du tableau pour ne pas couper une droite qui traverse t = 0.
  let offset = 0;
  while (offset < N && flat[offset]) offset++;
  const runs: { start: number; length: number }[] = [];
  let i = 0;
  while (i < N && runs.length < 24) {
    if (!flat[(i + offset) % N]) {
      i++;
      continue;
    }
    let len = 0;
    while (len < N && flat[(i + offset + len) % N]) len++;
    runs.push({ start: (i + offset) % N, length: len });
    i += len;
  }
  runs.sort((a, b) => b.length - a.length);
  const clear = trackClearance(track);
  // Pas de glissière sur le pont : le tablier a ses propres garde-corps.
  const bridge = findBridge(track);
  const straits: Strait[] = [];
  for (const run of runs) {
    if (straits.length >= count) break;
    if (run.length < 0.035 * N) continue;
    if (bridge) {
      const mid = ((run.start + run.length / 2) % N) / N;
      let d = Math.abs(mid - (bridge.from + bridge.to) / 2);
      d = Math.min(d, 1 - d);
      if (d < (bridge.to - bridge.from) / 2 + run.length / (2 * N) + 0.02) continue;
    }
    let best: (Strait & { len: number }) | null = null;
    for (const side of [1, -1] as const) {
      let start = -1;
      for (let k = 0; k <= run.length; k++) {
        const idx = (run.start + k) % N;
        let ok = false;
        if (k < run.length && flat[idx]) {
          const p = track.sample(idx / N, side * 77);
          ok = clear(idx / N, p.x, p.y, 70);
        }
        if (ok && start < 0) start = k;
        if (!ok && start >= 0) {
          const len = k - start;
          if (!best || len > best.len)
            best = {
              from: (run.start + start) / N,
              to: (run.start + k) / N,
              side,
              len,
            };
          start = -1;
        }
      }
    }
    if (best && best.len >= 0.04 * N)
      straits.push({ from: best.from, to: best.to, side: best.side });
  }
  return straits;
}

export interface Bridge {
  from: number;
  to: number;
  cx: number;
  cy: number;
}
/** Détecte le croisement du circuit : la première passe (t le plus petit) porte le pont. */
export function findBridge(track: Track): Bridge | null {
  const N = 460;
  const pts = Array.from({ length: N }, (_, i) => track.sample(i / N));
  let best = { d: 1e9, i: 0, j: 0 };
  for (let i = 0; i < N; i++)
    for (let j = i + 35; j <= i + N - 35; j++) {
      const b = pts[j % N];
      const d = Math.hypot(pts[i].x - b.x, pts[i].y - b.y);
      if (d < best.d) best = { d, i, j: j % N };
    }
  if (best.d > 26) return null;
  const a = pts[best.i],
    b = pts[best.j];
  const cx = (a.x + b.x) / 2,
    cy = (a.y + b.y) / 2;
  let from = best.i / N,
    to = best.i / N;
  while (from > best.i / N - 0.07) {
    const p = track.sample(from - 0.002);
    if (Math.hypot(p.x - cx, p.y - cy) > 130) break;
    from -= 0.002;
  }
  while (to < best.i / N + 0.07) {
    const p = track.sample(to + 0.002);
    if (Math.hypot(p.x - cx, p.y - cy) > 130) break;
    to += 0.002;
  }
  return { from, to, cx, cy };
}
function bridgeSubPath(track: Track, from: number, to: number, offset = 0) {
  const path = new Path2D();
  let first = true;
  for (let t = from; t <= to; t += 0.0025) {
    const p = track.sample(t, offset);
    if (first) {
      path.moveTo(p.x, p.y);
      first = false;
    } else path.lineTo(p.x, p.y);
  }
  return path;
}
/** Ombre portée et pilotis du pont, peints sous le tablier. */
export function drawBridgeShadow(
  ctx: CanvasRenderingContext2D,
  track: Track,
  bridge: Bridge,
) {
  const deck = bridgeSubPath(track, bridge.from, bridge.to);
  ctx.save();
  ctx.translate(9, 13);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#0a161c30";
  ctx.lineWidth = 122;
  ctx.stroke(deck);
  ctx.restore();
  for (const k of [0.14, 0.5, 0.86]) {
    const t = bridge.from + (bridge.to - bridge.from) * k;
    const p = track.sample(t);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = "#0a161c22";
    ctx.fillRect(3, -51, 12, 124);
    ctx.fillStyle = "#39434a";
    ctx.beginPath();
    ctx.roundRect(-6, -64, 12, 128, 4);
    ctx.fill();
    ctx.fillStyle = "#55606a";
    ctx.beginPath();
    ctx.roundRect(-4, -62, 4, 124, 2);
    ctx.fill();
    ctx.restore();
  }
}
/** Tablier du pont : dalle béton, vibreurs, asphalte, marquage et garde-corps. */
export function drawBridgeDeck(
  ctx: CanvasRenderingContext2D,
  track: Track,
  bridge: Bridge,
) {
  const deck = bridgeSubPath(track, bridge.from, bridge.to);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#98a19a";
  ctx.lineWidth = 122;
  ctx.stroke(deck);
  ctx.strokeStyle = "#7d867f";
  ctx.lineWidth = 114;
  ctx.stroke(deck);
  ctx.lineCap = "butt";
  ctx.setLineDash([15, 15]);
  ctx.strokeStyle = "#ece7d2";
  ctx.lineWidth = 116;
  ctx.stroke(deck);
  ctx.strokeStyle = "#cf4536";
  ctx.lineWidth = 116;
  ctx.stroke(deck);
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  const asphalt = ctx.createLinearGradient(
    bridge.cx - 80,
    bridge.cy - 80,
    bridge.cx + 80,
    bridge.cy + 80,
  );
  asphalt.addColorStop(0, "#4a5a60");
  asphalt.addColorStop(1, "#2e3d43");
  ctx.strokeStyle = asphalt;
  ctx.lineWidth = 98;
  ctx.stroke(deck);
  ctx.strokeStyle = "#ddd8c2";
  ctx.lineWidth = 92;
  ctx.stroke(deck);
  ctx.strokeStyle = asphalt;
  ctx.lineWidth = 90;
  ctx.stroke(deck);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e7eadc80";
  ctx.setLineDash([12, 17]);
  ctx.stroke(deck);
  ctx.setLineDash([]);
  // Garde-corps de chaque côté du tablier, avec leurs plots.
  for (const side of [-1, 1]) {
    const rail = bridgeSubPath(track, bridge.from, bridge.to, side * 62);
    ctx.strokeStyle = "#39434d";
    ctx.lineWidth = 5;
    ctx.stroke(rail);
    ctx.strokeStyle = "#cfd4c9";
    ctx.lineWidth = 2.5;
    ctx.stroke(rail);
    for (let t = bridge.from; t <= bridge.to; t += 0.008) {
      const p = track.sample(t, side * 62);
      ctx.fillStyle = "#e8e4d0";
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
  }
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
  ctx.lineWidth = 156;
  ctx.shadowColor = "#10261f60";
  ctx.shadowBlur = 14;
  ctx.stroke(path);
  ctx.restore();
  // Accotement herbeux, puis bourrelet sombre, liseré clair et bande crème.
  ctx.strokeStyle = "#7f8c67";
  ctx.lineWidth = 144;
  ctx.stroke(path);
  ctx.strokeStyle = "#263e35";
  ctx.lineWidth = 134;
  ctx.stroke(path);
  ctx.strokeStyle = "#c2c6aa";
  ctx.lineWidth = 125;
  ctx.stroke(path);
  ctx.strokeStyle = "#ece7d2";
  ctx.lineWidth = 116;
  ctx.stroke(path);
  // Vibreurs : pilules rouges alternant avec la bande crème sur tout le tour.
  ctx.lineCap = "butt";
  ctx.setLineDash([17, 17]);
  ctx.strokeStyle = "#cf4536";
  ctx.lineWidth = 116;
  ctx.stroke(path);
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  // Asphalte : dégradé traversant puis marbrures et grain pour casser le plat.
  const asphalt = ctx.createLinearGradient(0, 0, 260, 640);
  asphalt.addColorStop(0, "#4a5a60");
  asphalt.addColorStop(0.5, "#37474d");
  asphalt.addColorStop(1, "#2a393f");
  ctx.lineWidth = 98;
  ctx.strokeStyle = asphalt;
  ctx.stroke(path);
  ctx.lineWidth = 92;
  ctx.strokeStyle = "#ddd8c2";
  ctx.stroke(path);
  ctx.lineWidth = 90;
  ctx.strokeStyle = asphalt;
  ctx.stroke(path);
  for (let i = 0; i < 12500; i++) {
    const x = random() * 1000,
      y = random() * 640;
    ctx.lineWidth = 96;
    if (ctx.isPointInStroke(path, x, y)) {
      ctx.fillStyle = random() > 0.5 ? "#afbbc70e" : "#00000017";
      ctx.fillRect(x, y, 1.5, 1);
    }
  }
  for (let i = 0; i < 240; i++) {
    const x = random() * 1000,
      y = random() * 640;
    ctx.lineWidth = 90;
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
  ctx.fillRect(-26, -49, 5, 98);
  for (let col = 0; col < 5; col++)
    for (let row = 0; row < 11; row++) {
      ctx.fillStyle = (row + col) % 2 ? "#263139" : "#f1eee2";
      ctx.fillRect(col * 7 - 17, row * 9 - 49, 7, 9);
    }
  for (const lane of [-36, -12, 12, 36]) {
    ctx.strokeStyle = "#dfe7d6b3";
    ctx.lineWidth = 2;
    ctx.strokeRect(-67, lane - 9, 35, 18);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-67, lane - 9, 35, 18);
    ctx.clip();
    ctx.strokeStyle = "#dfe7d640";
    for (let i = -70; i < -28; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, lane - 11);
      ctx.lineTo(i + 12, lane + 11);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  // Bacs de gravier à l'extérieur des principaux virages, uniquement là où
  // aucune autre portion de piste ne passe à côté.
  const corners = findCorners(track);
  const clear = trackClearance(track);
  for (const corner of corners) {
    const ranges: [number, number][] = [];
    let start: number | null = null;
    for (let t = corner.from; t <= corner.to + 0.004; t += 0.004) {
      const p = track.sample(t, corner.side * 68);
      const ok = t <= corner.to && clear(t, p.x, p.y, 78);
      if (ok && start === null) start = t;
      if (!ok && start !== null) {
        ranges.push([start, t]);
        start = null;
      }
    }
    if (start !== null) ranges.push([start, corner.to]);
    for (const [from, to] of ranges) {
      if (to - from < 0.008) continue;
      const gravel = new Path2D();
      let first = true;
      for (let t = from; t <= to; t += 0.0025) {
        const p = track.sample(t, corner.side * 68);
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
      for (let i = 0; i < 60; i++) {
        const t = from + random() * (to - from);
        const p = track.sample(t, corner.side * (59 + random() * 18));
        ctx.fillStyle = random() > 0.5 ? "#b3986355" : "#e6d4a455";
        ctx.fillRect(p.x, p.y, 1.6, 1.2);
      }
      ctx.beginPath();
      first = true;
      for (let t = from; t <= to; t += 0.004) {
        const p = track.sample(t, corner.side * 59);
        if (first) {
          ctx.moveTo(p.x, p.y);
          first = false;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = "#a88c5840";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // Glissières et potelets le long des plus longues lignes droites détectées.
  for (const strait of findStraits(track)) {
    const { from, to, side } = strait;
    ctx.beginPath();
    for (let t = from; t < to; t += 0.002) {
      const p = track.sample(t, side * 77);
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
      const p = track.sample(t, side * 77);
      ctx.fillStyle = "#dbe0cb";
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
  }
  // Pont : pilotis et ombre d'abord, puis le tablier par-dessus la piste du bas.
  const bridge = findBridge(track);
  if (bridge) {
    drawBridgeShadow(ctx, track, bridge);
    drawBridgeDeck(ctx, track, bridge);
  }
  return path;
}
