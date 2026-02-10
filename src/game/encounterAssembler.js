import { QUESTION_BANK } from '../data/questionBank.js';
import { modifierImpact, seededRandom } from './modifiers.js';

const INTERACTION_TYPES = ['standard', 'prioritization', 'midVitalsUpdate', 'reassessmentPrompt', 'timePressured'];

function pickInteraction(rng, index) {
  return INTERACTION_TYPES[(Math.floor(rng() * INTERACTION_TYPES.length) + index) % INTERACTION_TYPES.length];
}

function wildcardFromModifiers(modifiers) {
  if (modifiers.pediatricSpike) return (q) => q.domain === 'Medical / Obstetrics / Gynecology';
  if (modifiers.equipmentFailure) return (q) => q.errorType === 'Missed reassessment';
  if (modifiers.weatherImpact) return (q) => q.domain === 'EMS Operations';
  return null;
}

/**
 * Procedural encounter assembly wrapper.
 * Wraps existing question bank without changing schema/scoring.
 */
export function assembleEncounter(config) {
  const {
    primaryDomain,
    secondaryDomains,
    difficultyBand,
    nodeModifiers,
    patientMix,
    recentErrorTypes,
    seed,
    encounterLength,
  } = config;

  const rng = seededRandom(seed);
  const impact = modifierImpact(nodeModifiers);
  const targetDifficulty = Math.max(1, Math.min(5, difficultyBand + impact.difficultyShift));

  const recentWeakness = (q) => recentErrorTypes.includes(q.errorType);
  const basePool = QUESTION_BANK.filter((q) => [primaryDomain, ...secondaryDomains].includes(q.domain));
  const weakPool = basePool.filter(recentWeakness);
  const wildcardMatcher = wildcardFromModifiers(nodeModifiers);
  const wildcardPool = wildcardMatcher ? QUESTION_BANK.filter(wildcardMatcher) : [];

  const ordered = [
    ...weakPool,
    ...basePool.filter((q) => q.domain === primaryDomain),
    ...basePool,
    ...wildcardPool,
  ].filter((q, idx, arr) => arr.findIndex((x) => x.id === q.id) === idx);

  const filtered = ordered.filter((q) => q.difficulty <= targetDifficulty + 1);
  const source = filtered.length ? filtered : ordered.length ? ordered : QUESTION_BANK;

  const questions = [];
  for (let i = 0; i < encounterLength; i += 1) {
    const q = source[(Math.floor(rng() * source.length) + i) % source.length];
    questions.push({
      ...q,
      interactionType: pickInteraction(rng, i),
      eventTag: rng() < 0.35 ? ['radioTraffic', 'patientDeterioration', 'sceneComplication'][Math.floor(rng() * 3)] : null,
      patientMix,
    });
  }

  return {
    questions,
    encounterMeta: {
      targetDifficulty,
      modifierImpact: impact,
    },
  };
}
