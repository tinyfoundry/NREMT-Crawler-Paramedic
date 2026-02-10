import type { Domain } from "@/lib/engine";

export type Mode = "study" | "exam";

export type HistoryEntry = {
  id: string;
  domain: Domain;
  difficulty: number;
  correct: boolean;
  mode: Mode;
  timestamp: number;
  errorType: string;
  isPediatric: boolean;
};

export type DomainReadiness = {
  score: number;
  label: "Below Passing" | "Borderline" | "Passing" | "Strong" | "Exam-Ready";
  attempts: number;
  topError: string;
};

// Paramedic Cognitive Test Plan-inspired weighting: domain buckets (66%) + Clinical Judgment (34%).
const domainWeights: Record<Domain, number> = {
  airway: 10,
  cardiology: 12,
  trauma: 8,
  medical: 26,
  pharm: 0,
  ops: 10,
};

const CLINICAL_JUDGMENT_WEIGHT = 34;

const RECENT_WINDOW = 90;

export function labelForScore(score: number): DomainReadiness["label"] {
  if (score < 50) return "Below Passing";
  if (score < 62) return "Borderline";
  if (score < 74) return "Passing";
  if (score < 86) return "Strong";
  return "Exam-Ready";
}

function recencyMultiplier(daysOld: number) {
  return Math.max(0.4, 1 - daysOld / RECENT_WINDOW);
}

function modeMultiplier(mode: Mode) {
  return mode === "exam" ? 1.25 : 0.85;
}

function difficultyMultiplier(difficulty: number) {
  return 0.8 + difficulty * 0.1;
}

function safeAvg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateDomainReadiness(history: HistoryEntry[]) {
  const now = Date.now();
  const byDomain = new Map<Domain, HistoryEntry[]>();

  history.forEach((entry) => {
    byDomain.set(entry.domain, [...(byDomain.get(entry.domain) ?? []), entry]);
  });

  const result = {} as Record<Domain, DomainReadiness>;
  (Object.keys(domainWeights) as Domain[]).forEach((domain) => {
    const entries = byDomain.get(domain) ?? [];
    const weighted = entries.map((entry) => {
      const ageDays = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
      const weight = recencyMultiplier(ageDays) * modeMultiplier(entry.mode) * difficultyMultiplier(entry.difficulty);
      return (entry.correct ? 1 : 0) * weight;
    });

    const totalWeight = entries
      .map((entry) => {
        const ageDays = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
        return recencyMultiplier(ageDays) * modeMultiplier(entry.mode) * difficultyMultiplier(entry.difficulty);
      })
      .reduce((a, b) => a + b, 0);

    const errorCounts: Record<string, number> = {};
    entries.filter((e) => !e.correct).forEach((entry) => {
      errorCounts[entry.errorType] = (errorCounts[entry.errorType] ?? 0) + 1;
    });

    const topError = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
    const score = totalWeight ? Math.round((weighted.reduce((a, b) => a + b, 0) / totalWeight) * 100) : 0;

    result[domain] = {
      score,
      label: labelForScore(score),
      attempts: entries.length,
      topError,
    };
  });

  return result;
}


function calculateClinicalJudgment(history: HistoryEntry[]) {
  if (!history.length) return 0;

  const recent = history.slice(-60);
  const crossDomainSet = new Set(recent.map((h) => h.domain));
  const crossDomainFactor = Math.min(1, crossDomainSet.size / 6);

  const weightedCorrect = recent.map((h) => {
    const ageDays = (Date.now() - h.timestamp) / (1000 * 60 * 60 * 24);
    const base = h.correct ? 1 : 0;
    return base * recencyMultiplier(ageDays) * modeMultiplier(h.mode) * difficultyMultiplier(h.difficulty);
  });

  const weightedTotal = recent.map((h) => {
    const ageDays = (Date.now() - h.timestamp) / (1000 * 60 * 60 * 24);
    return recencyMultiplier(ageDays) * modeMultiplier(h.mode) * difficultyMultiplier(h.difficulty);
  });

  const correctRatio = weightedTotal.reduce((a, b) => a + b, 0)
    ? weightedCorrect.reduce((a, b) => a + b, 0) / weightedTotal.reduce((a, b) => a + b, 0)
    : 0;

  const judgmentErrors = recent.filter((h) => ["priority_error", "assessment_order_error", "delayed_intervention"].includes(h.errorType)).length;
  const judgmentPenalty = Math.min(0.22, judgmentErrors / Math.max(1, recent.length));

  const score = (correctRatio * 0.75 + crossDomainFactor * 0.25 - judgmentPenalty) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateReadiness(history: HistoryEntry[]) {
  if (!history.length) return 0;
  const domainReadiness = calculateDomainReadiness(history);

  const weightedDomain = (Object.keys(domainWeights) as Domain[])
    .filter((domain) => domainWeights[domain] > 0)
    .map((domain) => domainReadiness[domain].score * (domainWeights[domain] / 66));

  const domainComposite = weightedDomain.reduce((a, b) => a + b, 0);
  const clinicalJudgmentScore = calculateClinicalJudgment(history);

  // Population-mix calibration for non-ops domains (target 15% pediatrics, 85% adults)
  const mixEligible = history.filter((h) => h.domain !== "ops");
  const pedsRate = mixEligible.length ? mixEligible.filter((h) => h.isPediatric).length / mixEligible.length : 0;
  const mixPenalty = Math.min(10, Math.round(Math.abs(0.15 - pedsRate) * 40));

  // Consistency bonus rewards stable recent performance, not lucky spikes
  const recent = history.slice(-30);
  const recentScores = recent.map((r) => (r.correct ? 1 : 0));
  const consistency = safeAvg(recentScores);
  const consistencyBonus = Math.round(consistency * 8);

  // Error burden penalty keeps score honest when cognitive mistakes repeat
  const recentErrors = recent.filter((r) => !r.correct).length;
  const errorPenalty = Math.min(8, Math.round(recentErrors / 4));

  const finalScore =
    domainComposite * (66 / 100) +
    clinicalJudgmentScore * (CLINICAL_JUDGMENT_WEIGHT / 100) +
    consistencyBonus -
    mixPenalty -
    errorPenalty;

  return Math.max(0, Math.min(100, Math.round(finalScore)));
}


export function calculateClinicalJudgmentScore(history: HistoryEntry[]) {
  return calculateClinicalJudgment(history);
}

export const domainPracticeCoaching: Record<Domain, { tip: string; pitfalls: string[]; whatTesting: string }> = {
  airway: {
    tip: "If mental status worsens, airway priorities outrank history collection.",
    pitfalls: ["Treating complaint before oxygenation", "Delayed ventilatory support"],
    whatTesting: "Can you protect oxygenation and ventilation under pressure?",
  },
  cardiology: {
    tip: "Unstable perfusion changes everything: stabilize first, explain later.",
    pitfalls: ["Chasing diagnostics before perfusion", "Ignoring hypotension trend"],
    whatTesting: "Can you identify unstable rhythm states and prioritize hemodynamics?",
  },
  trauma: {
    tip: "Hemorrhage and shock control should happen before detailed injury cataloging.",
    pitfalls: ["Delayed bleeding control", "Transport delay for low-value interventions"],
    whatTesting: "Can you sequence trauma care for survivability?",
  },
  medical: {
    tip: "Altered mental status is a high-priority finding even when vitals seem acceptable.",
    pitfalls: ["Symptom treatment before stabilization", "Ignoring trend deterioration"],
    whatTesting: "Can you reason through broad medical differentials safely?",
  },
  ops: {
    tip: "Scene safety and resource control are patient care decisions.",
    pitfalls: ["Entering unsafe scenes", "Skipping ICS/triage structure"],
    whatTesting: "Can you protect patient and crew while coordinating operations?",
  },
  pharm: {
    tip: "Medication clues are risk signals; use them to avoid contraindicated steps.",
    pitfalls: ["Missing medication implications", "Unsafe intervention despite contraindications"],
    whatTesting: "Can you connect meds to assessment risk and treatment safety?",
  },
};
