import { ARCHETYPES } from '../data/archetypes.js';
import { calculateDistrictHeat, heatColor } from '../game/heat.js';

function interactionPrompt(type) {
  if (type === 'prioritization') return 'Prioritize life threats before selecting an intervention.';
  if (type === 'midVitalsUpdate') return 'Monitor for a mid-call vitals update during decision-making.';
  if (type === 'reassessmentPrompt') return 'A reassessment checkpoint is expected before final commitment.';
  if (type === 'timePressured') return 'Time pressure is active. Commit decisively.';
  return 'Select the best clinical action.';
}

function eventText(tag) {
  if (tag === 'radioTraffic') return 'Radio traffic update: additional unit delays reported.';
  if (tag === 'patientDeterioration') return 'Patient status update: signs of deterioration are emerging.';
  if (tag === 'sceneComplication') return 'Scene complication: environmental factors are worsening access.';
  return '';
}

export function renderMap(state, onSelectNode) {
  const mapEl = document.querySelector('#district-map');
  const legendEl = document.querySelector('#node-legend');
  mapEl.innerHTML = '';

  const heat = calculateDistrictHeat(state.profile);

  state.nodes.forEach((node) => {
    const btn = document.createElement('button');
    btn.className = `node ${node.nodeType} ${node.completionState} risk-${node.riskLevel || 'moderate'}`;
    btn.style.left = `${node.pos.x}%`;
    btn.style.top = `${node.pos.y}%`;
    btn.style.background = heatColor(heat[node.district] ?? 0.5);
    btn.title = `${node.nodeId} • ${node.primaryDomain} • Risk ${node.riskLevel || 'moderate'}`;
    btn.disabled = node.completionState === 'locked';
    btn.innerHTML = `<span class="fog"></span>`;
    btn.addEventListener('click', () => onSelectNode(node));
    mapEl.append(btn);
  });

  legendEl.innerHTML = Object.entries(heat)
    .map(([district, value]) => {
      const d = state.districtState?.[district] || { stabilityLevel: 0, systemStress: 0, recentFailures: 0 };
      return `<div class="legend-item"><strong>${district}</strong><br/>Heat: ${(value * 100).toFixed(0)}%<br/>Stability ${d.stabilityLevel} / Stress ${d.systemStress}</div>`;
    })
    .join('');

  document.querySelector('#readiness-score').textContent = state.readiness;
}

export function renderArchetypeDialog(state, onSave) {
  const dialog = document.querySelector('#archetype-dialog');
  const opts = document.querySelector('#archetype-options');
  opts.innerHTML = ARCHETYPES.map((arch) => `
      <label class="archetype-card">
        <input type="radio" name="arch" value="${arch.id}" ${state.profile.archetypeId === arch.id ? 'checked' : ''}/>
        <strong>${arch.name}</strong>
        <p>${arch.description}</p>
      </label>
    `).join('');

  document.querySelector('#open-archetype').onclick = () => dialog.showModal();
  document.querySelector('#save-archetype').onclick = () => {
    const selected = document.querySelector('input[name="arch"]:checked')?.value;
    if (selected) onSave(selected);
  };
}

export function renderEncounterUI(model, stability, onAnswer, feedback = null) {
  const shell = document.querySelector('#encounter-shell');
  const q = model.questions[model.currentIndex];
  if (!q) return;

  const eventLine = eventText(q.eventTag);

  shell.innerHTML = `
    <h3>${model.node.nodeId} • ${model.node.nodeType.toUpperCase()} ENCOUNTER</h3>
    <p class="subtle">Interaction: ${q.interactionType}</p>
    <div class="meters">
      ${meter('Airway', stability.airway)}
      ${meter('Circulation', stability.circulation)}
      ${meter('Neurologic', stability.neuro)}
    </div>
    <div class="question-card">
      <p><strong>Question ${model.currentIndex + 1} / ${model.questions.length}</strong></p>
      ${eventLine ? `<p class="event-note">${eventLine}</p>` : ''}
      <p>${q.stem}</p>
      ${q.options.map((option, i) => `<button class="option" data-index="${i}">${option}</button>`).join('')}
      <div id="feedback" class="feedback">${feedback || interactionPrompt(q.interactionType)}</div>
    </div>
  `;

  shell.querySelectorAll('.option').forEach((btn) => {
    btn.addEventListener('click', () => onAnswer(Number(btn.dataset.index)));
  });
}

function meter(label, value) {
  return `<div class="meter"><div>${label}: ${value}</div><div class="bar"><div class="fill" style="width:${Math.max(value, 0)}%"></div></div></div>`;
}

export function renderOutcome(outcome) {
  const shell = document.querySelector('#encounter-shell');
  shell.innerHTML = `
    <h3>Encounter Outcome</h3>
    <p>${outcome.success ? 'Patient stabilized and transfer accepted.' : 'Patient deteriorated. Outcome unsuccessful.'}</p>
    <p>XP Awarded: ${outcome.xp}</p>
    <p>${outcome.note}</p>
    <p>${outcome.systemNote || ''}</p>
  `;
}
