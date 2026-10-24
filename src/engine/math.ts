export type Operator = "+" | "−" | "×";
export type Difficulty = "veryEasy" | "easy" | "medium" | "hard";
export interface Operation {
  id: number;
  a: number;
  b: number;
  operator: Operator;
  difficulty: Difficulty;
}
export function classify(a: number, b: number, operator: Operator): Difficulty {
  if (operator === "×") {
    if (Math.min(a, b) <= 1 || a === 10 || b === 10) return "veryEasy";
    if ([2, 5].includes(a) || [2, 5].includes(b)) return "easy";
    return a >= 6 && b >= 6 ? "hard" : "medium";
  }
  if (a <= 5 && b <= 5) return "veryEasy";
  const regroup =
    operator === "+" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
  if (Math.max(a, b) < 20) return "easy";
  return regroup && Math.min(a, b) >= 20 ? "hard" : "medium";
}
export function answer(op: Operation) {
  return op.operator === "+"
    ? op.a + op.b
    : op.operator === "−"
      ? op.a - op.b
      : op.a * op.b;
}
export function makeSequence(seed: number, length = 512): Operation[] {
  let state = seed >>> 0;
  const random = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 4294967296) * max);
  };
  const result: Operation[] = [];
  let bag: Operator[] = [];
  for (let id = 0; id < length; id++) {
    if (!bag.length) {
      bag = ["+", "−", "×"];
      for (let i = 2; i > 0; i--) {
        const j = random(i + 1);
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    const operator = bag.pop()!;
    let a: number, b: number;
    do {
      if (operator === "×") {
        a = random(10) + 1;
        b = random(10) + 1;
      } else {
        const limit = [6, 20, 50, 80][random(4)];
        a = random(limit);
        b = random(limit);
        if (operator === "−" && a < b) [a, b] = [b, a];
      }
    } while (
      result.at(-1)?.a === a &&
      result.at(-1)?.b === b &&
      result.at(-1)?.operator === operator
    );
    result.push({ id, a, b, operator, difficulty: classify(a, b, operator) });
  }
  return result;
}
