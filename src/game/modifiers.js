const MODIFIERS = ['highCallVolume', 'limitedResources', 'pediatricSpike', 'weatherImpact', 'equipmentFailure'];

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createSessionSeed(dayKey = new Date().toISOString().slice(0, 10)) {
  const existing = localStorage.getItem('paramedic-rpg-session-seed');
  const existingDay = localStorage.getItem('paramedic-rpg-session-day');
  if (existing && existingDay === dayKey) return Number(existing);

  const seed = hashString(`${dayKey}-${Math.random()}`);
  localStorage.setItem('paramedic-rpg-session-seed', String(seed));
  localStorage.setItem('paramedic-rpg-session-day', dayKey);
  return seed;
}

/**
 * Randomness logic:
 * - deterministic per day/session seed
 * - each node receives 1-2 active modifiers
 */
export function buildNodeModifiers(nodes, seed) {
  const rng = seededRandom(seed);
  return nodes.reduce((acc, node) => {
    const count = rng() < 0.65 ? 1 : 2;
    const picked = new Set();
    while (picked.size < count) {
      picked.add(MODIFIERS[Math.floor(rng() * MODIFIERS.length)]);
    }

    acc[node.nodeId] = {
      highCallVolume: picked.has('highCallVolume'),
      limitedResources: picked.has('limitedResources'),
      pediatricSpike: picked.has('pediatricSpike'),
      weatherImpact: picked.has('weatherImpact'),
      equipmentFailure: picked.has('equipmentFailure'),
    };
    return acc;
  }, {});
}

export function modifierImpact(modifiers = {}) {
  let difficultyShift = 0;
  let rewardMult = 1;
  if (modifiers.highCallVolume) difficultyShift += 1;
  if (modifiers.limitedResources) difficultyShift += 1;
  if (modifiers.weatherImpact) difficultyShift += 1;
  if (modifiers.equipmentFailure) difficultyShift += 1;
  if (modifiers.pediatricSpike) difficultyShift += 1;

  if (modifiers.limitedResources || modifiers.weatherImpact) rewardMult += 0.15;
  if (modifiers.highCallVolume) rewardMult += 0.1;

  return { difficultyShift, rewardMult };
}
