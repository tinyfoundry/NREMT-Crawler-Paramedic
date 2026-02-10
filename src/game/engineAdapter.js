import { assembleEncounter } from './encounterAssembler.js';

export function launchEncounter(node, profile, sessionSeed = Date.now()) {
  const recentErrorTypes = (profile.recentErrorTypes || []).slice(-5);
  const assembled = assembleEncounter({
    primaryDomain: node.primaryDomain,
    secondaryDomains: node.secondaryDomains,
    difficultyBand: node.dynamicDifficulty || node.difficultyTier,
    nodeModifiers: node.nodeModifiers || {},
    patientMix: node.patientMix,
    recentErrorTypes,
    seed: sessionSeed + node.nodeId.length + node.primaryDomain.length,
    encounterLength: node.encounterLength,
  });

  return {
    node,
    currentIndex: 0,
    questions: assembled.questions,
    answers: [],
    momentum: { correctStreak: 0, incorrectStreak: 0 },
    encounterMeta: assembled.encounterMeta,
  };
}

export function scoreAnswer(question, selectedIndex) {
  const correct = selectedIndex === question.correct;
  return {
    correct,
    rationale: question.rationale,
    errorType: correct ? null : question.errorType,
    domain: question.domain,
    clinicalJudgment: question.clinicalJudgment,
    interactionType: question.interactionType,
    eventTag: question.eventTag,
  };
}
