import { case1Fallback } from "@/data/case1-fallback";
import { case2Fallback } from "@/data/case2-fallback";
import type { CaseBundle } from "@/lib/types";

// Every case the home screen lists, in order.
export const CASE_NUMBERS: readonly number[] = [1, 2, 3];

// Offline copies of each case's public story, keyed by case number. No answers here.
// A case is playable only when its copy is in the code; the rest show as "Coming soon".
const fallbackByCaseNumber: Record<number, CaseBundle> = {
  1: case1Fallback,
  2: case2Fallback,
};

export function caseFallback(caseNumber: number): CaseBundle | null {
  return fallbackByCaseNumber[caseNumber] ?? null;
}

export type CaseListing = {
  caseNumber: number;
  // From the offline copy; null for a locked case.
  title: string | null;
  playable: boolean;
};

export function listCases(
  caseNumbers: readonly number[] = CASE_NUMBERS,
  fallbacks: Record<number, CaseBundle> = fallbackByCaseNumber,
): CaseListing[] {
  return caseNumbers.map((caseNumber) => {
    const fallback = fallbacks[caseNumber];
    return {
      caseNumber,
      title: fallback?.caseData.title ?? null,
      playable: Boolean(fallback),
    };
  });
}
