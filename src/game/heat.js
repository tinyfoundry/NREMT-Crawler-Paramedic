import { DISTRICT_DOMAIN_MAP, DOMAIN_WEIGHTS } from '../data/domains.js';

export function calculateDistrictHeat(profile) {
  return Object.entries(DISTRICT_DOMAIN_MAP).reduce((acc, [district, domain]) => {
    const accuracy = (profile.domainScores[domain] ?? 50) / 100;
    const domainWeight = DOMAIN_WEIGHTS[domain] ?? 0.15;
    const heat = (1 - accuracy) * domainWeight + profile.priorityErrorRate * 0.5 + profile.recentFailures * 0.25;
    acc[district] = Math.min(1, Number(heat.toFixed(2)));
    return acc;
  }, {});
}

export function heatColor(value) {
  if (value < 0.35) return 'var(--good)';
  if (value < 0.65) return 'var(--warn)';
  return 'var(--bad)';
}
