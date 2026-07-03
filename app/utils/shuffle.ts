export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle that guarantees the result differs from the input (for n > 1) */
export function shuffleGuaranteed<T>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  let result: T[];
  do { result = shuffle(arr); } while (result.every((v, i) => v === arr[i]));
  return result;
}
