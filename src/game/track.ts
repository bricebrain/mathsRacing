import Phaser from "phaser";
export const WORLD = { width: 1000, height: 640 };
// La même abscisse curviligne pilote les deux voies : le décalage reste visuel.
export function createTrack() {
  const controls = [
    [430, 545],
    [230, 545],
    [125, 475],
    [115, 325],
    [130, 180],
    [235, 105],
    [400, 105],
    [490, 155],
    [490, 245],
    [605, 270],
    [700, 205],
    [765, 105],
    [865, 140],
    [900, 255],
    [875, 370],
    [785, 450],
    [680, 470],
    [600, 400],
    [545, 410],
    [530, 505],
  ];
  const points = controls.map(([x, y]) => new Phaser.Math.Vector2(x, y));
  const curve = new Phaser.Curves.Spline([
    points.at(-1)!,
    ...points,
    points[0],
    points[1],
  ]);
  // Retirer les segments de fermeture auxiliaires de Catmull-Rom.
  const start = 1 / (points.length + 2),
    end = (points.length + 1) / (points.length + 2);
  const raw = Array.from({ length: 1401 }, (_, i) =>
    curve.getPoint(start + ((end - start) * i) / 1400),
  );
  const lengths = [0];
  for (let i = 1; i < raw.length; i++)
    lengths.push(
      lengths[i - 1] + Phaser.Math.Distance.BetweenPoints(raw[i - 1], raw[i]),
    );
  const length = lengths.at(-1)!;
  const sample = (progress: number, offset = 0) => {
    const target = (((progress % 1) + 1) % 1) * length;
    let low = 0,
      high = lengths.length - 2;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (lengths[mid] <= target) low = mid;
      else high = mid - 1;
    }
    const a = raw[low],
      b = raw[low + 1];
    const t = (target - lengths[low]) / (lengths[low + 1] - lengths[low] || 1);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return {
      x: a.x + (b.x - a.x) * t - Math.sin(angle) * offset,
      y: a.y + (b.y - a.y) * t + Math.cos(angle) * offset,
      angle,
    };
  };
  return { raw, sample, length };
}
export type Track = ReturnType<typeof createTrack>;
