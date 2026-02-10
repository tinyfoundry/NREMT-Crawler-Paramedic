import { DOMAIN_WEIGHTS } from '../data/domains.js';

const MODE_FACTOR = {
  study: 0.8,
  exam: 1.0,
  'final-shift': 1.15,
};

export function calculateReadiness(profile, mode = 'study') {
  const weighted = Object.entries(DOMAIN_WEIGHTS).reduce((sum, [domain, weight]) => {
    const score = profile.domainScores[domain] ?? 50;
    return sum + score * weight;
  }, 0);

  const multiplier = 1 - Math.min(profile.clinicalJudgmentErrors * 0.02, 0.25);
  const recency = Math.max(0.85, 1 - profile.recentFailures * 0.03);
  const finalScore = weighted * multiplier * recency * (MODE_FACTOR[mode] || 0.8);
  return Math.max(0, Math.min(100, Math.round(finalScore)));
}

export function updateDomainScore(current, isCorrect, domain, isClinical) {
  const change = isCorrect ? 3 : isClinical ? -6 : -4;
  return {
    ...current,
    [domain]: Math.max(10, Math.min(100, (current[domain] ?? 50) + change)),
  };
}
