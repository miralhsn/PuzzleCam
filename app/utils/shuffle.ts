/** Fisher-Yates in-place shuffle, returns the array */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Guaranteed non-trivial shuffle (never identity permutation for n > 1) */
export function shuffleGuaranteed<T>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  let result: T[];
  do {
    result = shuffle([...arr]);
  } while (result.every((v, i) => v === arr[i]));
  return result;
}
