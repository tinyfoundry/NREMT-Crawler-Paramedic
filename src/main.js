import { ARCHETYPES } from './data/archetypes.js';
import { launchEncounter, scoreAnswer } from './game/engineAdapter.js';
import { applyErrorToStability, createStability, isEncounterFailure } from './game/stability.js';
import { loadState, refreshNodeStates, saveState } from './game/state.js';
import { calculateReadiness, updateDomainScore } from './game/readiness.js';
import { startIntroFlow, clearIntroState } from './ui/introScene.js';
import { renderArchetypeDialog, renderEncounterUI, renderMap, renderOutcome } from './ui/render.js';
import {
  applyEncounterConsequences,
  enrichNodesWithMapSystems,
  loadDistrictState,
  loadNodeModifiers,
  saveDistrictState,
} from './game/mapSystem.js';
import { createSessionSeed } from './game/modifiers.js';

let state = loadState();
let encounter = null;
let stability = createStability();
let acceptingInput = true;
const sessionSeed = createSessionSeed();

function recalcWorld() {
  state.readiness = calculateReadiness(state.profile, state.profile.mode);
  const baseNodes = refreshNodeStates(state.profile, state.readiness, { recoveryNodes: state.profile.recoveryNodes });
  state.nodeModifiers = loadNodeModifiers(baseNodes);
  state.nodes = enrichNodesWithMapSystems(baseNodes, state.districtState, state.nodeModifiers);
}

function init() {
  state.districtState = loadDistrictState();

  startIntroFlow({
    initialArchetypeId: state.profile.archetypeId,
    onComplete: ({ selectedArchetype }) => {
      state.profile.archetypeId = selectedArchetype;
      recalcWorld();
      persistState();
      initializeAppUI();
    },
  });
}

function initializeAppUI() {
  bindSettingsControls();
  renderMap(state, startNodeEncounter);

  renderArchetypeDialog(state, (archetypeId) => {
    state.profile.archetypeId = archetypeId;
    persistAndRefresh();
  });
}

function bindSettingsControls() {
  const replayBtn = document.querySelector('#replay-intro');
  if (!replayBtn) return;
  replayBtn.addEventListener('click', () => {
    clearIntroState();
    location.reload();
  });
}

function startNodeEncounter(node) {
  encounter = launchEncounter(node, state.profile, sessionSeed);
  stability = createStability();
  acceptingInput = true;
  renderEncounterUI(encounter, stability, handleAnswer);
}

function applyMomentum(result) {
  if (result.correct) {
    encounter.momentum.correctStreak += 1;
    encounter.momentum.incorrectStreak = 0;
    if (encounter.momentum.correctStreak >= 2) {
      stability = {
        airway: Math.min(100, stability.airway + 4),
        circulation: Math.min(100, stability.circulation + 4),
        neuro: Math.min(100, stability.neuro + 4),
      };
    }
  } else {
    encounter.momentum.incorrectStreak += 1;
    encounter.momentum.correctStreak = 0;
  }
}

function handleAnswer(selectedIndex) {
  if (!acceptingInput || !encounter) return;
  acceptingInput = false;

  const question = encounter.questions[encounter.currentIndex];
  const result = scoreAnswer(question, selectedIndex);
  encounter.answers.push(result);
  applyMomentum(result);

  if (!result.correct) {
    const arch = ARCHETYPES.find((a) => a.id === state.profile.archetypeId);
    const streakPenalty = encounter.momentum.incorrectStreak >= 2 ? 1.15 : 1;
    stability = applyErrorToStability(stability, result.errorType, (arch?.stabilityTolerance || 1) * streakPenalty);

    state.profile.recentErrorTypes = [...state.profile.recentErrorTypes, result.errorType].slice(-8);

    if (result.clinicalJudgment) {
      state.profile.clinicalJudgmentErrors += 1;
    }

    state.profile.priorityErrorRate = Number(Math.min(1, state.profile.priorityErrorRate + 0.08).toFixed(2));
  } else {
    state.profile.priorityErrorRate = Number(Math.max(0, state.profile.priorityErrorRate - 0.03).toFixed(2));
  }

  state.profile.domainScores = updateDomainScore(
    state.profile.domainScores,
    result.correct,
    result.domain,
    result.clinicalJudgment,
  );

  const feedback = result.correct ? `Correct. ${result.rationale}` : `Not correct. ${result.rationale}`;
  renderEncounterUI(encounter, stability, handleAnswer, feedback);

  window.setTimeout(() => {
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

    acceptingInput = true;
    renderEncounterUI(encounter, stability, handleAnswer);
  }, 800);
}

function unlockRecoveryNode(failedNode) {
  const availableRecovery = state.nodes.find(
    (node) => node.district === failedNode.district && node.nodeType === 'standard' && !state.profile.completedNodes.includes(node.nodeId),
  );

  if (availableRecovery && !state.profile.recoveryNodes.includes(availableRecovery.nodeId)) {
    state.profile.recoveryNodes.push(availableRecovery.nodeId);
    return availableRecovery.nodeId;
  }
  return null;
}

function completeEncounter(success) {
  const node = encounter.node;
  const arch = ARCHETYPES.find((a) => a.id === state.profile.archetypeId);
  const streakBonus = encounter.momentum.correctStreak >= 2 ? 1.15 : 1;
  const modifier = (arch?.xpModifiers[node.primaryDomain] || 1) * (node.rewardMultiplier || 1) * streakBonus;
  const xpAward = Math.round(node.rewards.xp * modifier * (success ? 1 : 0.35));

  state.profile.xp += xpAward;

  Object.entries(node.rewards.domainXp || {}).forEach(([domain, value]) => {
    state.profile.domainXp[domain] = (state.profile.domainXp[domain] || 0) + (success ? value : Math.round(value * 0.3));
  });

  if (success && !state.profile.completedNodes.includes(node.nodeId)) {
    state.profile.completedNodes.push(node.nodeId);
  }

  if (!success) {
    state.profile.recentFailures += 1;
  } else {
    state.profile.recentFailures = Math.max(0, state.profile.recentFailures - 1);
  }

  state.districtState = applyEncounterConsequences({ districtState: state.districtState, node, success });
  saveDistrictState(state.districtState);

  const recoveryNodeId = success ? null : unlockRecoveryNode(node);

  recalcWorld();
  persistState();

  renderOutcome({
    success,
    xp: xpAward,
    note: success
      ? 'District stability improved. Continue reinforcing weak sectors.'
      : 'System stress increased in adjacent districts. Review rationale before reattempt.',
    systemNote: recoveryNodeId
      ? `Recovery path unlocked: ${recoveryNodeId}`
      : success
        ? 'Momentum bonus applied where appropriate.'
        : 'No new recovery path unlocked.',
  });

  renderMap(state, startNodeEncounter);
  encounter = null;
}

function persistState() {
  saveState(state);
}

function persistAndRefresh() {
  recalcWorld();
  persistState();
  renderMap(state, startNodeEncounter);
}

init();
