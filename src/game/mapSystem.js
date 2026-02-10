import { MAP_NODES } from '../data/mapNodes.js';
import { createSessionSeed, buildNodeModifiers, modifierImpact } from './modifiers.js';

const DISTRICT_KEY = 'paramedic-rpg-district-state-v1';
const MODIFIERS_KEY = 'paramedic-rpg-node-modifiers-v1';

function uniqueDistricts() {
  return [...new Set(MAP_NODES.map((node) => node.district))];
}

function defaultDistrictState() {
  return uniqueDistricts().reduce((acc, district) => {
    acc[district] = {
      stabilityLevel: 70,
      systemStress: 30,
      recentFailures: 0,
    };
    return acc;
  }, {});
}

export function loadDistrictState() {
  const raw = localStorage.getItem(DISTRICT_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  return { ...defaultDistrictState(), ...parsed };
}

export function saveDistrictState(state) {
  localStorage.setItem(DISTRICT_KEY, JSON.stringify(state));
}

export function loadNodeModifiers(nodes) {
  const seed = createSessionSeed();
  const cache = localStorage.getItem(MODIFIERS_KEY);
  if (cache) {
    const parsed = JSON.parse(cache);
    if (parsed.seed === seed) return parsed.modifiers;
  }

  const modifiers = buildNodeModifiers(nodes, seed);
  localStorage.setItem(MODIFIERS_KEY, JSON.stringify({ seed, modifiers }));
  return modifiers;
}

function districtRiskScore(districtStateEntry) {
  return Math.min(1, Math.max(0, (districtStateEntry.systemStress + districtStateEntry.recentFailures * 8) / 100));
}

export function enrichNodesWithMapSystems(nodes, districtState, nodeModifiers) {
  return nodes.map((node) => {
    const district = districtState[node.district];
    const modifiers = nodeModifiers[node.nodeId] || {};
    const modImpact = modifierImpact(modifiers);
    const risk = Math.min(1, districtRiskScore(district) + modImpact.difficultyShift * 0.08);

    return {
      ...node,
      nodeModifiers: modifiers,
      districtSnapshot: district,
      riskLevel: risk < 0.34 ? 'low' : risk < 0.67 ? 'moderate' : 'high',
      dynamicDifficulty: Math.max(1, Math.min(5, node.difficultyTier + Math.round(modImpact.difficultyShift / 2) + Math.round(risk * 2))),
      rewardMultiplier: 1 + risk * 0.5 + (modImpact.rewardMult - 1),
    };
  });
}

export function applyEncounterConsequences({ districtState, node, success }) {
  const next = { ...districtState };
  const district = { ...next[node.district] };

  if (success) {
    district.stabilityLevel = Math.min(100, district.stabilityLevel + 4);
    district.systemStress = Math.max(0, district.systemStress - 6);
    district.recentFailures = Math.max(0, district.recentFailures - 1);
  } else {
    district.stabilityLevel = Math.max(0, district.stabilityLevel - 8);
    district.systemStress = Math.min(100, district.systemStress + 10);
    district.recentFailures += 1;
  }

  next[node.district] = district;

  if (!success) {
    // Nearby districts absorb additional operational strain.
    Object.entries(next).forEach(([districtName, value]) => {
      if (districtName === node.district) return;
      next[districtName] = {
        ...value,
        systemStress: Math.min(100, value.systemStress + 2),
      };
    });
  }

  return next;
}
