import Phaser from "phaser";
export const WORLD = { width: 1000, height: 640 };
// La même abscisse curviligne pilote les deux voies : le décalage reste visuel.
export function createTrack() {
  // Tracé en « 8 » : les deux diagonales centrales se croisent vers (516,320),
  // la première passe sur un pont, la seconde passe dessous.
  const controls = [
    [430, 548],
    [230, 548],
    [95, 480],
    [90, 325],
    [110, 175],
    [235, 85],
    [400, 85],
    [460, 205],
    [570, 430],
    [620, 490],
    [745, 500],
    [895, 430],
    [920, 255],
    [890, 130],
    [780, 85],
    [575, 205],
    [460, 430],
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
