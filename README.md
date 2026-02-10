# NREMT Paramedic Prep Engine (Static Readiness Engine)

A fully static NREMT-style paramedic prep app focused on readiness confidence, not raw quiz scores.

## What this app now does
- 500-question original JSON bank (`data/questions.seed.json`)
- Study mode (instant coaching) and Exam mode (delayed feedback, 3:30 timer)
- Continuous **Test Readiness Score (0-100)** weighted by:
  - Paramedic-plan weighting with Clinical Judgment integration (Airway 10, Cardiology 12, Trauma 8, Medical/OB/GYN+Pharm 29, Ops 10, Clinical Judgment 34)
  - recent performance decay
  - exam mode impact > study mode impact
  - difficulty solved correctly
  - consistency and repeated error penalties
  - 85% adult / 15% pediatric calibration
- Domain readiness meters with status labels:
  - Below Passing, Borderline, Passing, Strong, Exam-Ready
- Area-specific practice flows per domain with tips, pitfalls, and NREMT coaching
- Error-pattern coaching (priority, scope, delayed intervention, assessment order)
- Gamification aligned to learning quality (difficulty-weighted XP, level titles, badges)
- localStorage persistence and session resume

## Public inspiration sources
See `sources.md`.

## Run locally
```bash
pnpm install
pnpm dev
```

## Build static output
```bash
pnpm build
```

## Deploy
- GitHub Pages: publish static `out/`
- Vercel: build command `pnpm build`, output `out`

## Safe question contribution rules
- Keep all question stems/rationales original
- Use public references for pattern inspiration only
- Never copy text from proprietary or gated test banks
