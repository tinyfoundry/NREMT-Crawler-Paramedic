import { ARCHETYPES } from './data/archetypes.js';
import { launchEncounter, scoreAnswer } from './game/engineAdapter.js';
import { applyErrorToStability, createStability, isEncounterFailure } from './game/stability.js';
import { loadState, refreshNodeStates, saveState } from './game/state.js';
import { calculateReadiness, updateDomainScore } from './game/readiness.js';
import { renderArchetypeDialog, renderEncounterUI, renderMap, renderOutcome } from './ui/render.js';

let state = loadState();
let encounter = null;
let stability = createStability();

function init() {
  renderMap(state, startNodeEncounter);
  renderArchetypeDialog(state, (archetypeId) => {
    state.profile.archetypeId = archetypeId;
    persistAndRefresh();
  });
}

function startNodeEncounter(node) {
  encounter = launchEncounter(node, state.profile);
  stability = createStability();
  renderEncounterUI(encounter, stability, handleAnswer);
}

function handleAnswer(selectedIndex) {
  const question = encounter.questions[encounter.currentIndex];
  const result = scoreAnswer(question, selectedIndex);
  encounter.answers.push(result);

  if (!result.correct) {
    const arch = ARCHETYPES.find((a) => a.id === state.profile.archetypeId);
    stability = applyErrorToStability(stability, result.errorType, arch?.stabilityTolerance || 1);
    if (result.clinicalJudgment) state.profile.clinicalJudgmentErrors += 1;
    state.profile.priorityErrorRate = Number((state.profile.priorityErrorRate + 0.08).toFixed(2));
  }

  state.profile.domainScores = updateDomainScore(
    state.profile.domainScores,
    result.correct,
    result.domain,
    result.clinicalJudgment,
  );

  if (isEncounterFailure(stability)) {
    completeEncounter(false);
    return;
  }

  encounter.currentIndex += 1;
  if (encounter.currentIndex >= encounter.questions.length) {
    completeEncounter(true);
    return;
  }

  if (encounter.node.nodeType !== 'boss') {
    stability = createStability();
  }

  renderEncounterUI(encounter, stability, handleAnswer);
}

function completeEncounter(success) {
  const node = encounter.node;
  const arch = ARCHETYPES.find((a) => a.id === state.profile.archetypeId);
  const modifier = arch?.xpModifiers[node.primaryDomain] || 1;
  const bonus = success && state.profile.recentFailures > 0 ? 1.1 : 1;
  const xpAward = Math.round(node.rewards.xp * modifier * bonus * (success ? 1 : 0.35));

  state.profile.xp += xpAward;
  if (success && !state.profile.completedNodes.includes(node.nodeId)) {
    state.profile.completedNodes.push(node.nodeId);
  }

  if (!success) {
    state.profile.recentFailures += 1;
  } else {
    state.profile.recentFailures = Math.max(0, state.profile.recentFailures - 1);
  }

  state.readiness = calculateReadiness(state.profile, state.profile.mode);
  state.nodes = refreshNodeStates(state.profile, state.readiness);
  saveState(state);

  renderOutcome({
    success,
    xp: xpAward,
    note: success ? 'District readiness improved. Additional nodes may now be available.' : 'Review rationale and reassessment priorities before retrying.',
  });
  renderMap(state, startNodeEncounter);
}

function persistAndRefresh() {
  state.readiness = calculateReadiness(state.profile, state.profile.mode);
  state.nodes = refreshNodeStates(state.profile, state.readiness);
  saveState(state);
  renderMap(state, startNodeEncounter);
}

init();
