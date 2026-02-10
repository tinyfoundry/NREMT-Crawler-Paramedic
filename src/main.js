import { ARCHETYPES } from './data/archetypes.js';
import { launchEncounter, scoreAnswer } from './game/engineAdapter.js';
import { applyErrorToStability, createStability, isEncounterFailure } from './game/stability.js';
import { loadState, refreshNodeStates, saveState } from './game/state.js';
import { calculateReadiness, updateDomainScore } from './game/readiness.js';
import { startIntroFlow, clearIntroState } from './ui/introScene.js';
import { renderArchetypeDialog, renderEncounterUI, renderMap, renderOutcome } from './ui/render.js';

let state = loadState();
let encounter = null;
let stability = createStability();
let acceptingInput = true;

function init() {
  startIntroFlow({
    initialArchetypeId: state.profile.archetypeId,
    onComplete: ({ selectedArchetype }) => {
      state.profile.archetypeId = selectedArchetype;
      state.readiness = calculateReadiness(state.profile, state.profile.mode);
      state.nodes = refreshNodeStates(state.profile, state.readiness);
      saveState(state);
      initializeAppUI();
    },
  });
}

function initializeAppUI() {
  bindModeControls();
  bindSettingsControls();
  renderMap(state, startNodeEncounter);

  renderArchetypeDialog(state, (archetypeId) => {
    state.profile.archetypeId = archetypeId;
    persistAndRefresh();
  });

  updateFinalShiftButton();
}

function bindModeControls() {
  const modeSelect = document.querySelector('#mode-select');
  const finalShiftBtn = document.querySelector('#start-final-shift');

  if (modeSelect) {
    modeSelect.value = state.profile.mode;
    modeSelect.addEventListener('change', () => {
      state.profile.mode = modeSelect.value;
      persistAndRefresh();
    });
  }

  if (finalShiftBtn && modeSelect) {
    finalShiftBtn.addEventListener('click', () => {
      if (state.readiness < 85) return;
      state.profile.mode = 'final-shift';
      modeSelect.value = 'final-shift';
      persistAndRefresh();
    });
  }
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
  encounter = launchEncounter(node, state.profile);
  stability = createStability();
  acceptingInput = true;
  renderEncounterUI(encounter, stability, handleAnswer);
}

function handleAnswer(selectedIndex) {
  if (!acceptingInput || !encounter) return;
  acceptingInput = false;

  const question = encounter.questions[encounter.currentIndex];
  const result = scoreAnswer(question, selectedIndex);
  encounter.answers.push(result);

  if (!result.correct) {
    const arch = ARCHETYPES.find((a) => a.id === state.profile.archetypeId);
    stability = applyErrorToStability(stability, result.errorType, arch?.stabilityTolerance || 1);

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

function completeEncounter(success) {
  const node = encounter.node;
  const arch = ARCHETYPES.find((a) => a.id === state.profile.archetypeId);
  const modifier = arch?.xpModifiers[node.primaryDomain] || 1;
  const bonus = success && state.profile.recentFailures > 0 ? 1.1 : 1;
  const xpAward = Math.round(node.rewards.xp * modifier * bonus * (success ? 1 : 0.35));

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

  state.readiness = calculateReadiness(state.profile, state.profile.mode);
  state.nodes = refreshNodeStates(state.profile, state.readiness);
  saveState(state);

  const unlocked = state.nodes.filter(
    (entry) => entry.completionState === 'available' && !state.profile.completedNodes.includes(entry.nodeId),
  );

  renderOutcome({
    success,
    xp: xpAward,
    note: success
      ? 'District readiness improved. Continue reinforcing weak districts.'
      : 'Review rationale and reassessment priorities before retrying.',
    unlockNote: unlocked.length
      ? `Available nodes: ${unlocked
          .slice(0, 4)
          .map((entry) => entry.nodeId)
          .join(', ')}`
      : 'No new nodes unlocked yet.',
  });

  renderMap(state, startNodeEncounter);
  updateFinalShiftButton();
  encounter = null;
}

function updateFinalShiftButton() {
  const btn = document.querySelector('#start-final-shift');
  if (!btn) return;
  btn.disabled = state.readiness < 85;
  btn.textContent = state.readiness >= 85 ? 'Start Final Shift (Unlocked)' : 'Start Final Shift (Locked)';
}

function persistAndRefresh() {
  state.readiness = calculateReadiness(state.profile, state.profile.mode);
  state.nodes = refreshNodeStates(state.profile, state.readiness);
  saveState(state);
  renderMap(state, startNodeEncounter);
  updateFinalShiftButton();
}

init();
