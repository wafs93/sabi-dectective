import type { AccusationResult, ResultTier } from "@/lib/types";

// Private per-case answer. Loaded on the server only; never sent to the browser.
export type CaseSolution = {
  solutionSuspectId: string;
  // Every one of these must be cited (with the right suspect) to crack the case.
  keyClueIds: string[];
  redHerringClueIds: string[];
  texts: Record<ResultTier, { title: string; text: string }>;
};

export type AccusationInput = {
  suspectId: string;
  clueIds: string[];
};

// Deterministic: the same solution and accusation always give the same result.
export function evaluateAccusation(
  solution: CaseSolution,
  accusation: AccusationInput,
  accusedName: string,
): AccusationResult {
  const cited = new Set(accusation.clueIds);

  if (accusation.suspectId !== solution.solutionSuspectId) {
    return build(solution, "missed", accusedName, [
      `The evidence doesn't hold up against ${accusedName}.`,
    ]);
  }

  const keyTotal = solution.keyClueIds.length;
  const keyCited = solution.keyClueIds.filter((id) => cited.has(id)).length;

  if (keyTotal > 0 && keyCited === keyTotal) {
    return build(solution, "cracked", accusedName, ["You cited every key piece of evidence."]);
  }

  const feedback =
    keyCited === 0
      ? ["You named the right suspect, but none of the evidence you cited proves it."]
      : [`You named the right suspect and cited ${keyCited} of ${keyTotal} key pieces of evidence.`];
  return build(solution, "close", accusedName, feedback);
}

function build(
  solution: CaseSolution,
  outcome: ResultTier,
  accusedName: string,
  feedback: string[],
): AccusationResult {
  const { title, text } = solution.texts[outcome];
  return {
    outcome,
    title,
    explanation: text.replaceAll("{accused}", accusedName),
    feedback,
  };
}
