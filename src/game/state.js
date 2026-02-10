import { DEFAULT_ARCHETYPE_ID } from '../data/archetypes.js';
import { MAP_NODES } from '../data/mapNodes.js';
import { calculateReadiness } from './readiness.js';

const STORAGE_KEY = 'paramedic-rpg-state-v2';

const baseProfile = {
  archetypeId: DEFAULT_ARCHETYPE_ID,
  xp: 0,
  domainXp: {},
  completedNodes: [],
  recoveryNodes: [],
  domainScores: {
    'Airway, Respiration & Ventilation': 52,
    'Cardiology & Resuscitation': 55,
    Trauma: 54,
    'Medical / Obstetrics / Gynecology': 56,
    'EMS Operations': 58,
  },
  clinicalJudgmentErrors: 0,
  priorityErrorRate: 0,
  recentFailures: 0,
  recentErrorTypes: [],
  mode: 'study',
};

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  const profile = {
    ...baseProfile,
    ...parsed,
    domainXp: { ...baseProfile.domainXp, ...(parsed.domainXp || {}) },
    recentErrorTypes: Array.isArray(parsed.recentErrorTypes) ? parsed.recentErrorTypes : [],
    recoveryNodes: Array.isArray(parsed.recoveryNodes) ? parsed.recoveryNodes : [],
  };

  const readiness = calculateReadiness(profile, profile.mode);
  return { profile, readiness, nodes: refreshNodeStates(profile, readiness) };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
}

export function refreshNodeStates(profile, readiness, options = {}) {
  const recoverySet = new Set(options.recoveryNodes || profile.recoveryNodes || []);

  return MAP_NODES.map((node) => {
    const completed = profile.completedNodes.includes(node.nodeId);
    const prereqNodesComplete = node.prerequisites.completedNodes.every((id) => profile.completedNodes.includes(id));
    const available = readiness >= node.prerequisites.minReadiness && prereqNodesComplete;

    return {
      ...node,
      completionState: completed ? 'completed' : available || recoverySet.has(node.nodeId) ? 'available' : 'locked',
    };
  });
}
