# NREMT Paramedic RPG Layer (Front-End Only)

This repository extends an NREMT-style question workflow with a **2D, node-based Jacksonville-inspired map game layer**.

## Extension Plan

### What stays from the baseline engine concept
- Question-first encounter flow and rationale usage.
- Existing question schema and answer scoring behavior.
- Readiness score and localStorage persistence.

### What is added on top
- Dynamic map session system with per-node modifiers.
- District-level stability/stress/failure state that influences risk and rewards.
- Procedural encounter assembly wrapper around existing questions.
- Interaction variety tags and surprise event messaging.
- Momentum and consequence systems for replayability.

## New System Modules

- `src/game/modifiers.js`: session seed, deterministic RNG, and modifier impact math.
- `src/game/mapSystem.js`: district state persistence, node modifier assignment, dynamic risk/difficulty, failure consequences.
- `src/game/encounterAssembler.js`: `assembleEncounter(config)` procedural builder with weakness bias and wildcard injection.

## Procedural Rules Overview

### Map / District System
Each node receives daily/session modifiers:
- `highCallVolume`
- `limitedResources`
- `pediatricSpike`
- `weatherImpact`
- `equipmentFailure`

District state tracks:
- `stabilityLevel`
- `systemStress`
- `recentFailures`

These values influence node risk, dynamic encounter difficulty, and reward multipliers.

### Encounter Assembly
`assembleEncounter(config)` always:
- Includes primary domain coverage.
- Biases toward recent error-type weaknesses.
- Injects wildcard questions based on modifiers.
- Randomizes question order/interaction style per seeded run.

### Interaction Variety
Questions can be wrapped with interaction tags:
- `prioritization`
- `midVitalsUpdate`
- `reassessmentPrompt`
- `timePressured`
- `standard`

Surprise event banners:
- Radio traffic update
- Patient deterioration
- Scene complication

### Pressure & Consequences
- Correct streaks can add stability buffer and XP momentum bonus.
- Incorrect streaks increase deterioration penalties.
- Encounter failure updates district stress and may unlock recovery nodes.

## Intro Layer
A first-load narrative onboarding sequence is implemented in `src/ui/introScene.js` and can be replayed with the **Replay Intro** button.

## Run

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.
