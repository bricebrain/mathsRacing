export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 4294967296) * max);
  };
}
export function shuffle<T>(values: readonly T[], random: (max: number) => number): T[] {
  const items = [...values];
  for (let i = items.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
export function drawCycle<T>(values: readonly T[], random: (max: number) => number) {
  let bag: T[] = [];
  let previous: T | undefined;
  return () => {
    if (!bag.length) {
      bag = shuffle(values, random);
      if (bag.length > 1 && bag.at(-1) === previous)
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    previous = bag.pop()!;
    return previous;
  };
}
