import { DEFAULT_ARCHETYPE_ID } from '../data/archetypes.js';
import { MAP_NODES } from '../data/mapNodes.js';
import { calculateReadiness } from './readiness.js';

const STORAGE_KEY = 'paramedic-rpg-state-v1';

const baseProfile = {
  archetypeId: DEFAULT_ARCHETYPE_ID,
  xp: 0,
  domainXp: {},
  completedNodes: [],
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
  mode: 'study',
};

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : baseProfile;
  const profile = { ...baseProfile, ...parsed };
  const readiness = calculateReadiness(profile, profile.mode);
  return { profile, readiness, nodes: refreshNodeStates(profile, readiness) };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
}

export function refreshNodeStates(profile, readiness) {
  return MAP_NODES.map((node) => {
    const completed = profile.completedNodes.includes(node.nodeId);
    const prereqNodesComplete = node.prerequisites.completedNodes.every((id) => profile.completedNodes.includes(id));
    const available = readiness >= node.prerequisites.minReadiness && prereqNodesComplete;
    return {
      ...node,
      completionState: completed ? 'completed' : available ? 'available' : 'locked',
    };
  });
}
