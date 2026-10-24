import Phaser from "phaser";

function channel(hex: number, shift: number) {
  return (hex >> shift) & 255;
}
function mix(a: number, b: number, t: number) {
  return (
    (Math.round(channel(a, 16) + (channel(b, 16) - channel(a, 16)) * t) << 16) |
    (Math.round(channel(a, 8) + (channel(b, 8) - channel(a, 8)) * t) << 8) |
    Math.round(channel(a, 0) + (channel(b, 0) - channel(a, 0)) * t)
  );
}
const css = (hex: number, alpha = 1) =>
  `#${hex.toString(16).padStart(6, "0")}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
const lighten = (c: number, t: number) => mix(c, 0xffffff, t);
const darken = (c: number, t: number) => mix(c, 0x0c1216, t);

/**
 * Monoplace vue du dessus, orientée vers +X, dessinée en 156×96 (2× la taille
 * à l'écran : affichée à scale 0.46, soit ~72×44 px comme l'ancienne voiture).
 */
export function createCarTexture(
  scene: Phaser.Scene,
  key: string,
  color: number,
) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, 156, 96)!;
  const ctx = texture.getContext();
  // Le dessin s'écrit « nez à gauche » puis est retourné horizontalement,
  // pour que la voiture finale pointe vers +X, le sens de marche de la course.
  ctx.translate(156, 0);
  ctx.scale(-1, 1);
  const body = (y0: number, y1: number) => {
    const gradient = ctx.createLinearGradient(0, y0, 0, y1);
    gradient.addColorStop(0, css(darken(color, 0.3)));
    gradient.addColorStop(0.22, css(color));
    gradient.addColorStop(0.55, css(lighten(color, 0.3)));
    gradient.addColorStop(0.8, css(color));
    gradient.addColorStop(1, css(darken(color, 0.35)));
    return gradient;
  };
  const wheel = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = "#0e1319";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2.6);
    ctx.fill();
    ctx.fillStyle = "#39424d";
    ctx.beginPath();
    ctx.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, (h - 5) / 2.8);
    ctx.fill();
    ctx.fillStyle = "#141a20";
    for (let i = 0; i < 3; i++)
      ctx.fillRect(x + 4, y + 3 + (i * (h - 6)) / 3, w - 8, 1.4);
    ctx.fillStyle = "#ffffff14";
    ctx.fillRect(x + 3, y + 1.5, w - 6, 2);
  };

  // Triangles de suspension reliant le châssis aux roues.
  ctx.strokeStyle = "#1a222b";
  ctx.lineWidth = 3.5;
  for (const [x1, y1, x2, y2] of [
    [62, 34, 56, 20],
    [62, 62, 56, 76],
    [92, 34, 98, 20],
    [92, 62, 98, 76],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Roues apparentes : trains avant étroits, arrière plus larges.
  wheel(44, 11, 24, 15);
  wheel(44, 70, 24, 15);
  wheel(84, 8, 28, 18);
  wheel(84, 70, 28, 18);

  // Aileron avant : plan principal sombre + liseré de la couleur, pavillons.
  ctx.fillStyle = "#151c23";
  ctx.beginPath();
  ctx.roundRect(4, 22, 18, 52, 5);
  ctx.fill();
  ctx.fillStyle = body(22, 74);
  ctx.fillRect(7, 25, 6, 46);
  ctx.fillStyle = "#0e1319";
  ctx.fillRect(2, 18, 12, 7);
  ctx.fillRect(2, 71, 12, 7);

  // Nez effilé du cockpit vers l'aileron avant.
  ctx.fillStyle = body(34, 62);
  ctx.beginPath();
  ctx.moveTo(16, 44);
  ctx.quadraticCurveTo(40, 33, 62, 37);
  ctx.lineTo(62, 59);
  ctx.quadraticCurveTo(40, 63, 16, 52);
  ctx.closePath();
  ctx.fill();

  // Goulotte de frein et liseré du nez.
  ctx.fillStyle = css(lighten(color, 0.45), 0.85);
  ctx.fillRect(24, 46, 34, 4);

  // Pontons latéraux avec entrées d'air sombres.
  for (const y of [24, 54]) {
    ctx.fillStyle = body(y, y + 18);
    ctx.beginPath();
    ctx.roundRect(72, y, 46, 18, 8);
    ctx.fill();
    ctx.fillStyle = "#0d1218";
    ctx.beginPath();
    ctx.roundRect(74, y + 3.5, 7, 11, 3);
    ctx.fill();
  }

  // Capot moteur central, prolongé sous l'aileron arrière.
  ctx.fillStyle = body(36, 60);
  ctx.beginPath();
  ctx.roundRect(58, 38, 84, 20, 9);
  ctx.fill();
  ctx.fillStyle = css(0xffffff, 0.26);
  ctx.fillRect(64, 46, 72, 3.5);
  ctx.fillStyle = css(darken(color, 0.5), 0.5);
  ctx.fillRect(64, 51, 72, 2);

  // Habitacle : ouverture sombre, casque blanc, visière teintée.
  ctx.fillStyle = "#0c1116";
  ctx.beginPath();
  ctx.roundRect(84, 35, 28, 26, 10);
  ctx.fill();
  const helmet = ctx.createRadialGradient(94, 45, 1, 97, 48, 9);
  helmet.addColorStop(0, "#ffffff");
  helmet.addColorStop(1, "#b9c3cc");
  ctx.fillStyle = helmet;
  ctx.beginPath();
  ctx.arc(97, 48, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = css(color, 0.9);
  ctx.fillRect(89, 44.5, 10, 7);
  ctx.fillStyle = "#1d2833";
  ctx.beginPath();
  ctx.roundRect(91, 43.5, 5, 9, 2.5);
  ctx.fill();
  ctx.fillStyle = "#ffffff70";
  ctx.fillRect(92, 42.5, 6, 2);

  // Aileron arrière : pavillons, plan bicolore, échappements.
  ctx.fillStyle = "#0e1319";
  ctx.fillRect(134, 18, 14, 11);
  ctx.fillRect(134, 67, 14, 11);
  ctx.fillStyle = "#1a222b";
  ctx.beginPath();
  ctx.roundRect(131, 20, 19, 56, 5);
  ctx.fill();
  ctx.fillStyle = body(20, 76);
  ctx.fillRect(134.5, 24, 8, 48);
  ctx.fillStyle = "#0e1319";
  ctx.fillRect(146, 26, 3, 44);
  ctx.fillStyle = "#5c666f";
  ctx.beginPath();
  ctx.arc(142, 48, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#232a30";
  ctx.beginPath();
  ctx.arc(142, 48, 2, 0, Math.PI * 2);
  ctx.fill();

  // Reflet longitudinal pour l'effet laqué.
  const gloss = ctx.createLinearGradient(0, 28, 0, 68);
  gloss.addColorStop(0, "#ffffff00");
  gloss.addColorStop(0.45, "#ffffff2e");
  gloss.addColorStop(1, "#ffffff00");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.roundRect(30, 28, 112, 40, 14);
  ctx.fill();

  // Antenne du capot.
  ctx.strokeStyle = "#0e1319";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(108, 46);
  ctx.lineTo(112, 43);
  ctx.stroke();

  texture.refresh();
}

export function createGlowTexture(scene: Phaser.Scene) {
  const texture = scene.textures.createCanvas("glow", 32, 32)!;
  const ctx = texture.getContext(),
    gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.2, "#c5faff");
  gradient.addColorStop(0.5, "#51dfff88");
  gradient.addColorStop(1, "#36beff00");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  texture.refresh();
}

export function createShadowTexture(scene: Phaser.Scene) {
  const texture = scene.textures.createCanvas("car-shadow", 88, 56)!;
  const ctx = texture.getContext();
  ctx.fillStyle = "#071b191f";
  ctx.beginPath();
  ctx.ellipse(44, 28, 42, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#071b1926";
  ctx.beginPath();
  ctx.ellipse(44, 28, 36, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  texture.refresh();
}
