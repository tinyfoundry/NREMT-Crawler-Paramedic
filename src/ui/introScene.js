import { ARCHETYPES, DEFAULT_ARCHETYPE_ID } from '../data/archetypes.js';

const INTRO_STORAGE_KEY = 'paramedic-rpg-intro-v1';

function loadIntroState() {
  const raw = localStorage.getItem(INTRO_STORAGE_KEY);
  return raw ? JSON.parse(raw) : { introCompleted: false, selectedArchetype: DEFAULT_ARCHETYPE_ID };
}

function saveIntroState(patch) {
  const current = loadIntroState();
  const next = { ...current, ...patch };
  localStorage.setItem(INTRO_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function createSceneButton(label, onClick, className = 'intro-btn') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function mountIntroShell() {
  const shell = document.createElement('section');
  shell.id = 'intro-overlay';
  shell.className = 'intro-overlay';
  shell.innerHTML = '<div class="intro-backdrop"></div><div class="intro-card" id="intro-card"></div>';
  document.body.append(shell);
  return shell;
}

function renderSceneOne(card, next) {
  card.className = 'intro-card scene-night-before';
  card.innerHTML = `
    <h2>The Night Before</h2>
    <p>The shift is quiet, but tomorrow will not be.</p>
    <p>Your protocols are memorized. Your judgment is what gets tested.</p>
    <p>Rest now. At first light, every decision carries weight.</p>
  `;
  card.append(createSceneButton('Start Studying', next));
}

function renderSceneTwo(card, next) {
  card.className = 'intro-card scene-system-boot';
  card.innerHTML = `
    <h2>System Boot</h2>
    <pre class="boot-log">INITIALIZING CLINICAL ASSESSMENT ENGINE…</pre>
    <p>You are no longer studying the exam. You are inside it.</p>
  `;
  card.append(createSceneButton('Continue', next));
}

function renderSceneThree(card, selected, onPick, onConfirm) {
  card.className = 'intro-card scene-path-select';
  card.innerHTML = '<h2>Choose Your Paramedic Path</h2><p>Select the lens you bring to every call.</p>';

  const group = document.createElement('div');
  group.className = 'intro-path-grid';

  ARCHETYPES.forEach((arch) => {
    const choice = document.createElement('button');
    choice.type = 'button';
    choice.className = `intro-path ${selected === arch.id ? 'active' : ''}`;
    choice.innerHTML = `<strong>${arch.name}</strong><span>${arch.description}</span>`;
    choice.addEventListener('click', () => onPick(arch.id));
    group.append(choice);
  });

  card.append(group);
  card.append(createSceneButton('Confirm Path', () => onConfirm(selected || DEFAULT_ARCHETYPE_ID), 'intro-btn primary'));

}

function renderSceneFour(card, finish) {
  card.className = 'intro-card scene-enter-city';
  card.innerHTML = `
    <h2>Enter the City</h2>
    <p>Units are holding. Calls are queued. Districts are waiting.</p>
    <p class="scene-quote">Every call matters. Every mistake compounds.</p>
  `;
  card.append(createSceneButton('Enter Map', finish, 'intro-btn primary'));
}

/**
 * Intro orchestrator.
 * - Adjust scene text in renderSceneX helpers above.
 * - Skip behavior can be changed via `shouldSkipIntro` in `startIntroFlow`.
 */
export function startIntroFlow({ forceReplay = false, initialArchetypeId, onComplete }) {
  const introState = loadIntroState();
  const shouldSkipIntro = introState.introCompleted && !forceReplay;

  if (shouldSkipIntro) {
    onComplete({
      selectedArchetype: introState.selectedArchetype || initialArchetypeId || DEFAULT_ARCHETYPE_ID,
      introCompleted: true,
    });
    return;
  }

  let selectedArchetype = introState.selectedArchetype || initialArchetypeId || DEFAULT_ARCHETYPE_ID;
  const shell = mountIntroShell();
  const card = shell.querySelector('#intro-card');

  const closeIntro = (finalSelection) => {
    saveIntroState({ introCompleted: true, selectedArchetype: finalSelection });
    shell.classList.add('closing');
    window.setTimeout(() => shell.remove(), 320);
    onComplete({ selectedArchetype: finalSelection, introCompleted: true });
  };

  const goSceneFour = () => renderSceneFour(card, () => closeIntro(selectedArchetype));
  const goSceneThree = () => {
    const rerender = () => {
      renderSceneThree(
        card,
        selectedArchetype,
        (archId) => {
          selectedArchetype = archId;
          saveIntroState({ selectedArchetype: archId });
          rerender();
        },
        (archId) => {
          selectedArchetype = archId;
          saveIntroState({ selectedArchetype: archId });
          goSceneFour();
        },
      );
    };
    rerender();
  };

  renderSceneOne(card, () => renderSceneTwo(card, goSceneThree));
}

export function clearIntroState() {
  localStorage.removeItem(INTRO_STORAGE_KEY);
}
