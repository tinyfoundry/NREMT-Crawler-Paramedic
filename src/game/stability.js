const ERROR_DELTAS = {
  'Ignored airway': { airway: -25, circulation: 0, neuro: -5 },
  'Delayed care': { airway: -10, circulation: -10, neuro: 0 },
  'Wrong priority': { airway: -15, circulation: -10, neuro: -10 },
  'Out of scope': { airway: 0, circulation: -15, neuro: -5 },
  'Missed reassessment': { airway: -5, circulation: -10, neuro: -15 },
};

export function createStability(start = 100) {
  return { airway: start, circulation: start, neuro: start };
}

export function applyErrorToStability(stability, errorType, tolerance = 1) {
  const deltas = ERROR_DELTAS[errorType] || { airway: -10, circulation: -10, neuro: -10 };
  return {
    airway: Math.round(stability.airway + deltas.airway * tolerance),
    circulation: Math.round(stability.circulation + deltas.circulation * tolerance),
    neuro: Math.round(stability.neuro + deltas.neuro * tolerance),
  };
}

export function isEncounterFailure(stability) {
  return stability.airway <= 0 || stability.circulation <= 0 || stability.neuro <= 0;
}
