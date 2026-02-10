import { questionBank, type Domain, type PromptType, type Question } from "@/lib/engine";

/**
 * Creates safe, original variant-style entries for contributors.
 */
export function expandQuestionBank(targetCount: number): Question[] {
  const domains: Domain[] = ["airway", "cardiology", "trauma", "medical", "ops", "pharm"];
  const promptTypes: PromptType[] = ["first", "next", "suspect", "best_action"];

  const out: Question[] = [];

  for (let i = 0; i < targetCount; i += 1) {
    const domain = domains[i % domains.length];
    const promptType = promptTypes[i % promptTypes.length];
    const difficulty = (i % 5) + 1;
    const base = questionBank.find((q) => q.domain === domain && q.promptType === promptType && q.difficulty === difficulty) ?? questionBank[0];

    out.push({
      ...base,
      id: `${base.id}-v-${i + 1}`,
      stem: `${base.stem} (Variant ${i + 1})`,
    });
  }

  return out;
}
