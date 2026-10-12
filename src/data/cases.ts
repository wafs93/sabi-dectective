import { case1Fallback } from "@/data/case1-fallback";
import { case2Fallback } from "@/data/case2-fallback";
import { case3Fallback } from "@/data/case3/case3";
import { case99Fallback } from "@/data/test-case/case99";
import type { CaseBundle } from "@/lib/types";

// Every case the home screen lists, in order.
export const CASE_NUMBERS: readonly number[] = [1, 2, 3];

// Test-only cases, for Vercel Preview: listed after the real cases when the build has
// NEXT_PUBLIC_ENABLE_TEST_CASE=1, and never counted in the record, rank or Today's case.
// Each registration below is a plain check of that flag, so with it off Next.js drops
// the test case's code and content from the build entirely.
export const TEST_CASE_NUMBERS: readonly number[] =
  process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1" ? [99] : [];

export function isTestCase(caseNumber: number): boolean {
  return TEST_CASE_NUMBERS.includes(caseNumber);
}

// Offline copies of each case's public story, keyed by case number. No answers here.
// A case is playable only when its copy is in the code; the rest show as "Coming soon".
const fallbackByCaseNumber: Record<number, CaseBundle> = {
  1: case1Fallback,
  2: case2Fallback,
  3: case3Fallback,
};
if (process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1") fallbackByCaseNumber[99] = case99Fallback;

export function caseFallback(caseNumber: number): CaseBundle | null {
  return fallbackByCaseNumber[caseNumber] ?? null;
}

// How a hidden clue is revealed: by confronting a suspect, or by connecting two clues.
export type HiddenClueKind = "confront" | "combine";

// Whether a case has locked clues. This is the only switch for the feature: when it is
// false the game never asks /api/unlock about that case and shows no locked slots.
// When on, it is the case's public summary: one entry per hidden clue, giving only how
// that clue is revealed. Never names, ids, rules or content; the server holds those.
const lockedCluesByCaseNumber: Record<number, false | { hidden: readonly HiddenClueKind[] }> = {
  1: false,
  2: false,
  // Case 3 hides 20 clues: 8 revealed by questioning, 12 by connecting clues.
  3: { hidden: [...Array<HiddenClueKind>(8).fill("confront"), ...Array<HiddenClueKind>(12).fill("combine")] },
};
// Case 99 hides one clue revealed by questioning and one by connecting clues.
if (process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1") {
  lockedCluesByCaseNumber[99] = { hidden: ["confront", "combine"] };
}

export function hasLockedClues(caseNumber: number): boolean {
  return Boolean(lockedCluesByCaseNumber[caseNumber]);
}

// The unlock type of each hidden clue in a switched-on case, or [] when the switch is off.
export function hiddenClueKinds(caseNumber: number): readonly HiddenClueKind[] {
  const setup = lockedCluesByCaseNumber[caseNumber];
  return setup ? setup.hidden : [];
}

export type CaseListing = {
  caseNumber: number;
  // From the offline copy; null for a locked case.
  title: string | null;
  playable: boolean;
  // Only on test cases (see TEST_CASE_NUMBERS).
  test?: true;
};

export function listCases(
  caseNumbers: readonly number[] = [...CASE_NUMBERS, ...TEST_CASE_NUMBERS],
  fallbacks: Record<number, CaseBundle> = fallbackByCaseNumber,
): CaseListing[] {
  return caseNumbers.map((caseNumber) => {
    const fallback = fallbacks[caseNumber];
    return {
      caseNumber,
      title: fallback?.caseData.title ?? null,
      playable: Boolean(fallback),
      ...(isTestCase(caseNumber) && { test: true as const }),
    };
  });
}
