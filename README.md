# NREMT Paramedic RPG Layer (Front-End Only)

This repository extends an NREMT-style question workflow with a **2D, node-based Jacksonville-inspired map game layer**.

## Extension Plan

### What stays from the baseline engine concept
- Question-first encounter flow (study/exam style delivery).
- Scenario-based prompt + rationale loop.
- Adaptive difficulty behavior through encounter orchestration.
- Readiness score and localStorage persistence.

### What is added in this repo
- **Map Layer**: District and node progression with prerequisites and readiness gates.
- **Encounter Orchestrator**: 1–5 question encounters tied to map node type (`standard`, `chain`, `boss`, `certification`).
- **Patient Stability**: Deterministic Airway/Circulation/Neurologic meters tied to error types.
- **Paramedic Archetypes**: Cosmetic/progression modifiers only (no content gating).
- **District Heat**: Weakness heat map for recommendation and progression strategy.

## New Modules

- `src/data/mapNodes.js`: Jacksonville-themed starter map with 12 progression nodes.
- `src/game/stability.js`: deterministic deterioration model by error type.
- `src/game/readiness.js`: weighted readiness formula and domain scoring.
- `src/game/heat.js`: district heat calculations.
- `src/game/engineAdapter.js`: encounter orchestration adapter around question data.
- `src/ui/render.js`: map rendering, archetype modal, encounter UI wrappers.
- `src/main.js`: app controller and progression loop.

## Node Schema

Nodes follow this structure:

```json
{
  "nodeId": "DT-CARD-03",
  "district": "Downtown Core",
  "primaryDomain": "Cardiology & Resuscitation",
  "secondaryDomains": ["Airway"],
  "difficultyTier": 3,
  "nodeType": "standard | chain | boss | certification",
  "patientMix": { "adult": 0.85, "pediatric": 0.15 },
  "encounterLength": 1,
  "prerequisites": {
    "minReadiness": 62,
    "completedNodes": ["DT-CARD-01"]
  },
  "rewards": {
    "xp": 120,
    "domainXp": { "Cardiology & Resuscitation": 80 }
  },
  "completionState": "locked | available | completed"
}
```

## Readiness Model

Readiness is formalized as:

```text
ReadinessScore =
Σ(domainScore × domainWeight)
× ClinicalJudgmentMultiplier
× RecencyFactor
× ModeFactor
```

Mode factors:
- Study: `0.8`
- Exam: `1.0`
- Final Shift: `1.15`

## Run

Since this is static front-end code:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Notes

- Professional EMS phrasing is used for outcomes.
- Boss encounters persist damage between linked questions.
- Final Shift gating can be attached to a 110–150 question registry simulation endpoint later.
