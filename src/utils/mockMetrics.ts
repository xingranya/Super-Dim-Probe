const hashSeed = (seed: string) => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};

export const seededRange = (
  seed: string,
  min: number,
  max: number,
  decimals = 0
) => {
  const normalized = hashSeed(seed) / 4294967295;
  const value = min + (max - min) * normalized;
  return Number(value.toFixed(decimals));
};
