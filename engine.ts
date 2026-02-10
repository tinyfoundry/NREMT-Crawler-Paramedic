import seedQuestions from "@/data/questions.seed.json";

export type Domain = "airway" | "cardiology" | "trauma" | "medical" | "ops" | "pharm";
export type PromptType = "first" | "next" | "suspect" | "best_action";
export type ChoiceKey = "A" | "B" | "C" | "D" | "E";

export type Question = {
  id: string;
  domain: Domain;
  difficulty: number;
  promptType: PromptType;
  stem: string;
  choices: Record<ChoiceKey, string>;
  correct: ChoiceKey;
  rationale: string;
};

export type SessionState = {
  difficulty: number;
  weakDomains: Partial<Record<Domain, number>>;
  errorTypes: Record<string, number>;
  consecutiveCorrect: number;
};

export const questionBank = seedQuestions as Question[];

const hierarchy = ["mental status", "life threats / ABCs", "chief complaint", "vital trends"];

export function choiceEntries(question: Question) {
  return Object.entries(question.choices) as [ChoiceKey, string][];
}

export function evaluateAnswer(question: Question, answer: ChoiceKey) {
  const isCorrect = question.correct === answer;
  const selected = question.choices[answer] ?? "";

  let errorType = "none";
  if (!isCorrect) {
    if (selected.toLowerCase().includes("outside") || selected.toLowerCase().includes("scope")) errorType = "scope_error";
    else if (selected.toLowerCase().includes("delay")) errorType = "delayed_intervention";
    else if (selected.toLowerCase().includes("lower-priority")) errorType = "assessment_order_error";
    else errorType = "priority_error";
  }

  return {
    isCorrect,
    explanation: isCorrect
      ? question.rationale
      : `${question.rationale} Your selected option likely reflects ${errorType.replaceAll("_", " ")}.`,
    takeaway: `NREMT takeaway: ${hierarchy.join(" → ")}.`,
    appliedRule: isCorrect ? "Priority hierarchy applied correctly." : "Priority hierarchy violated.",
    errorType,
  };
}

export function pickNextQuestion(state: SessionState, used: Set<string>): Question {
  const weaknessOrder = Object.entries(state.weakDomains)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([domain]) => domain as Domain);

  const preferredDomain = weaknessOrder[0];

  const pool = questionBank.filter(
    (q) =>
      !used.has(q.id) &&
      Math.abs(q.difficulty - state.difficulty) <= 1 &&
      (!preferredDomain || q.domain === preferredDomain || Math.random() > 0.4),
  );

  if (pool.length === 0) return questionBank.find((q) => !used.has(q.id)) ?? questionBank[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function updateAdaptiveState(state: SessionState, question: Question, correct: boolean, errorType: string): SessionState {
  const streak = correct ? state.consecutiveCorrect + 1 : 0;
  const bump = correct && streak >= 2 ? 1 : 0;
  const nextDifficulty = correct ? Math.min(5, state.difficulty + bump) : Math.max(1, state.difficulty - 1);
  const weakDomains = { ...state.weakDomains };
  const errorTypes = { ...state.errorTypes };

  if (!correct) {
    weakDomains[question.domain] = (weakDomains[question.domain] ?? 0) + 1;
    errorTypes[errorType] = (errorTypes[errorType] ?? 0) + 1;
  }

  return {
    difficulty: nextDifficulty,
    weakDomains,
    errorTypes,
    consecutiveCorrect: streak,
  };
}
