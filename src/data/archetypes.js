export const ARCHETYPES = [
  {
    id: 'firefighter',
    name: 'Firefighter Paramedic',
    description: '+10% EMS Ops / Trauma XP, -5% Medical XP',
    xpModifiers: {
      'EMS Operations': 1.1,
      Trauma: 1.1,
      'Medical / Obstetrics / Gynecology': 0.95,
    },
    stabilityTolerance: 1,
  },
  {
    id: 'transport',
    name: 'Transport Paramedic',
    description: '+10% Medical/Cardiology XP, -5% EMS Ops XP',
    xpModifiers: {
      'Medical / Obstetrics / Gynecology': 1.1,
      'Cardiology & Resuscitation': 1.1,
      'EMS Operations': 0.95,
    },
    stabilityTolerance: 1,
  },
  {
    id: 'critical-care',
    name: 'Critical Care Paramedic',
    description: '+10% Airway/Cardio XP, lower stability tolerance',
    xpModifiers: {
      'Airway, Respiration & Ventilation': 1.1,
      'Cardiology & Resuscitation': 1.1,
    },
    stabilityTolerance: 0.9,
  },
];

export const DEFAULT_ARCHETYPE_ID = 'transport';
