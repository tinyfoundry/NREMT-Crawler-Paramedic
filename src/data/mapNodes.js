export const MAP_NODES = [
  {
    nodeId: 'DT-CARD-01', district: 'Downtown Core', primaryDomain: 'Cardiology & Resuscitation', secondaryDomains: ['Airway, Respiration & Ventilation'], difficultyTier: 1, nodeType: 'standard', patientMix: { adult: 0.8, pediatric: 0.2 }, encounterLength: 1,
    prerequisites: { minReadiness: 0, completedNodes: [] }, rewards: { xp: 80, domainXp: { 'Cardiology & Resuscitation': 60 } }, completionState: 'available', pos: { x: 27, y: 34 },
  },
  {
    nodeId: 'DT-CARD-03', district: 'Downtown Core', primaryDomain: 'Cardiology & Resuscitation', secondaryDomains: ['Airway, Respiration & Ventilation'], difficultyTier: 3, nodeType: 'chain', patientMix: { adult: 0.85, pediatric: 0.15 }, encounterLength: 2,
    prerequisites: { minReadiness: 62, completedNodes: ['DT-CARD-01'] }, rewards: { xp: 120, domainXp: { 'Cardiology & Resuscitation': 80 } }, completionState: 'locked', pos: { x: 36, y: 25 },
  },
  {
    nodeId: 'RES-MED-01', district: 'Residential Areas', primaryDomain: 'Medical / Obstetrics / Gynecology', secondaryDomains: ['EMS Operations'], difficultyTier: 1, nodeType: 'standard', patientMix: { adult: 0.9, pediatric: 0.1 }, encounterLength: 1,
    prerequisites: { minReadiness: 10, completedNodes: [] }, rewards: { xp: 85, domainXp: { 'Medical / Obstetrics / Gynecology': 70 } }, completionState: 'locked', pos: { x: 56, y: 62 },
  },
  {
    nodeId: 'RES-MED-02', district: 'Residential Areas', primaryDomain: 'Medical / Obstetrics / Gynecology', secondaryDomains: ['Cardiology & Resuscitation'], difficultyTier: 2, nodeType: 'chain', patientMix: { adult: 0.85, pediatric: 0.15 }, encounterLength: 2,
    prerequisites: { minReadiness: 45, completedNodes: ['RES-MED-01'] }, rewards: { xp: 110, domainXp: { 'Medical / Obstetrics / Gynecology': 80 } }, completionState: 'locked', pos: { x: 65, y: 58 },
  },
  {
    nodeId: 'HW-TRA-01', district: 'Highways & Bridges', primaryDomain: 'Trauma', secondaryDomains: ['EMS Operations'], difficultyTier: 2, nodeType: 'standard', patientMix: { adult: 0.92, pediatric: 0.08 }, encounterLength: 1,
    prerequisites: { minReadiness: 25, completedNodes: ['DT-CARD-01'] }, rewards: { xp: 100, domainXp: { Trauma: 75 } }, completionState: 'locked', pos: { x: 44, y: 50 },
  },
  {
    nodeId: 'HW-TRA-03', district: 'Highways & Bridges', primaryDomain: 'Trauma', secondaryDomains: ['Airway, Respiration & Ventilation'], difficultyTier: 3, nodeType: 'chain', patientMix: { adult: 0.86, pediatric: 0.14 }, encounterLength: 2,
    prerequisites: { minReadiness: 60, completedNodes: ['HW-TRA-01'] }, rewards: { xp: 130, domainXp: { Trauma: 90 } }, completionState: 'locked', pos: { x: 53, y: 46 },
  },
  {
    nodeId: 'PORT-OPS-01', district: 'Industrial / Port', primaryDomain: 'EMS Operations', secondaryDomains: ['Trauma'], difficultyTier: 2, nodeType: 'standard', patientMix: { adult: 0.88, pediatric: 0.12 }, encounterLength: 1,
    prerequisites: { minReadiness: 30, completedNodes: ['DT-CARD-01'] }, rewards: { xp: 95, domainXp: { 'EMS Operations': 75 } }, completionState: 'locked', pos: { x: 75, y: 43 },
  },
  {
    nodeId: 'PORT-OPS-02', district: 'Industrial / Port', primaryDomain: 'EMS Operations', secondaryDomains: ['Medical / Obstetrics / Gynecology'], difficultyTier: 3, nodeType: 'chain', patientMix: { adult: 0.9, pediatric: 0.1 }, encounterLength: 2,
    prerequisites: { minReadiness: 68, completedNodes: ['PORT-OPS-01'] }, rewards: { xp: 125, domainXp: { 'EMS Operations': 90 } }, completionState: 'locked', pos: { x: 81, y: 50 },
  },
  {
    nodeId: 'BEACH-AIR-01', district: 'Beaches / Waterways', primaryDomain: 'Airway, Respiration & Ventilation', secondaryDomains: ['Trauma'], difficultyTier: 2, nodeType: 'standard', patientMix: { adult: 0.83, pediatric: 0.17 }, encounterLength: 1,
    prerequisites: { minReadiness: 32, completedNodes: ['DT-CARD-01'] }, rewards: { xp: 100, domainXp: { 'Airway, Respiration & Ventilation': 80 } }, completionState: 'locked', pos: { x: 88, y: 30 },
  },
  {
    nodeId: 'BEACH-AIR-03', district: 'Beaches / Waterways', primaryDomain: 'Airway, Respiration & Ventilation', secondaryDomains: ['Medical / Obstetrics / Gynecology'], difficultyTier: 3, nodeType: 'chain', patientMix: { adult: 0.82, pediatric: 0.18 }, encounterLength: 2,
    prerequisites: { minReadiness: 66, completedNodes: ['BEACH-AIR-01'] }, rewards: { xp: 132, domainXp: { 'Airway, Respiration & Ventilation': 95 } }, completionState: 'locked', pos: { x: 92, y: 38 },
  },
  {
    nodeId: 'HOSP-BOSS-01', district: 'Hospitals / Stations', primaryDomain: 'Cardiology & Resuscitation', secondaryDomains: ['Medical / Obstetrics / Gynecology', 'Airway, Respiration & Ventilation'], difficultyTier: 4, nodeType: 'boss', patientMix: { adult: 0.9, pediatric: 0.1 }, encounterLength: 4,
    prerequisites: { minReadiness: 78, completedNodes: ['DT-CARD-03', 'RES-MED-02', 'HW-TRA-03', 'PORT-OPS-02', 'BEACH-AIR-03'] }, rewards: { xp: 250, domainXp: { 'Cardiology & Resuscitation': 120 } }, completionState: 'locked', pos: { x: 48, y: 18 },
  },
  {
    nodeId: 'HOSP-CERT-01', district: 'Hospitals / Stations', primaryDomain: 'Medical / Obstetrics / Gynecology', secondaryDomains: ['Cardiology & Resuscitation', 'EMS Operations'], difficultyTier: 5, nodeType: 'certification', patientMix: { adult: 0.88, pediatric: 0.12 }, encounterLength: 5,
    prerequisites: { minReadiness: 92, completedNodes: ['HOSP-BOSS-01'] }, rewards: { xp: 350, domainXp: { 'Medical / Obstetrics / Gynecology': 140 } }, completionState: 'locked', pos: { x: 57, y: 15 },
  },
];
