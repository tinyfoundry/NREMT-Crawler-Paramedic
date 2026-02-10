import { QUESTION_BANK } from '../data/questionBank.js';

function selectQuestions(node, previousErrors = 0) {
  const targetDifficulty = Math.max(1, Math.min(5, node.difficultyTier + (previousErrors > 0 ? -1 : 0)));
  const primary = QUESTION_BANK.filter((q) => q.domain === node.primaryDomain && q.difficulty <= targetDifficulty + 1);
  const secondary = QUESTION_BANK.filter((q) => node.secondaryDomains.includes(q.domain));
  const candidates = [...primary, ...secondary];
  return candidates.slice(0, node.encounterLength);
}

export function launchEncounter(node, state) {
  const questions = selectQuestions(node, state.recentFailures);
  return {
    node,
    currentIndex: 0,
    questions,
    answers: [],
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
  };
}
