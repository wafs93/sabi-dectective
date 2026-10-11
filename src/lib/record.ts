import type { Progress, ResultTier, SavedResult } from "@/lib/types";

// The player's career record, kept in this browser's localStorage only.
// It is untrusted and display-only: nothing here is ever sent to the server
// or used for scoring. The server's /api/accuse result is the only verdict.

export type CaseRecord = {
  best: ResultTier;
  last: ResultTier;
  plays: number;
};

export type PlayerRecord = {
  version: 1;
  // Keyed by case number as a string, so more cases can be added later.
  cases: Record<string, CaseRecord>;
};

export const emptyRecord: PlayerRecord = { version: 1, cases: {} };

const TIERS: ResultTier[] = ["missed", "close", "cracked"];
const strength = (t: ResultTier) => TIERS.indexOf(t);
const isTier = (v: unknown): v is ResultTier => TIERS.includes(v as ResultTier);

// Highest threshold first.
export const RANKS: { min: number; title: string }[] = [
  { min: 10, title: "Chief" },
  { min: 6, title: "Senior Detective" },
  { min: 3, title: "Detective" },
  { min: 1, title: "Junior Detective" },
  { min: 0, title: "Rookie" },
];

export function rankFor(casesSolved: number): string {
  const n = Number.isFinite(casesSolved) ? Math.max(0, Math.floor(casesSolved)) : 0;
  return RANKS.find((r) => n >= r.min)!.title;
}

// A case counts as solved when the right culprit was named (Cracked or Close Call).
export const isSolved = (t: ResultTier) => t === "cracked" || t === "close";

export function casesSolved(record: PlayerRecord): number {
  return Object.values(record.cases).filter((c) => isSolved(c.best)).length;
}

export function bestResult(record: PlayerRecord): ResultTier | null {
  let best: ResultTier | null = null;
  for (const c of Object.values(record.cases)) {
    if (best === null || strength(c.best) > strength(best)) best = c.best;
  }
  return best;
}

export function recordVerdict(
  record: PlayerRecord,
  caseNumber: number,
  verdict: ResultTier,
): PlayerRecord {
  const key = String(caseNumber);
  const prev = record.cases[key];
  const next: CaseRecord = prev
    ? {
        best: strength(verdict) > strength(prev.best) ? verdict : prev.best,
        last: verdict,
        plays: prev.plays + 1,
      }
    : { best: verdict, last: verdict, plays: 1 };
  return { ...record, cases: { ...record.cases, [key]: next } };
}

export type CaseStatus = "new" | "in-progress" | ResultTier;

// What the home screen shows for a case.
// A finished game on screen wins; then a game in progress; then the last verdict
// from an earlier play; otherwise the case is new.
export function caseStatus({
  caseNumber,
  savedResult,
  progress,
  record,
}: {
  caseNumber: number;
  savedResult: SavedResult | null;
  progress: Progress;
  record: PlayerRecord;
}): CaseStatus {
  if (savedResult) return savedResult.result.outcome;
  if (progress.foundClueIds.length > 0 || progress.contradictions.length > 0) return "in-progress";
  return record.cases[String(caseNumber)]?.last ?? "new";
}

// Anything that doesn't look right is dropped rather than trusted.
export function parseRecord(raw: unknown): PlayerRecord {
  if (typeof raw !== "object" || raw === null) return emptyRecord;
  const cases = (raw as { cases?: unknown }).cases;
  if (typeof cases !== "object" || cases === null) return emptyRecord;
  const clean: Record<string, CaseRecord> = {};
  for (const [key, value] of Object.entries(cases)) {
    if (!/^\d{1,4}$/.test(key) || typeof value !== "object" || value === null) continue;
    const { best, last, plays } = value as Record<string, unknown>;
    if (!isTier(best) || !isTier(last)) continue;
    const n = typeof plays === "number" && Number.isFinite(plays) ? Math.max(1, Math.floor(plays)) : 1;
    clean[key] = { best, last, plays: Math.min(n, 9999) };
  }
  return { version: 1, cases: clean };
}

// ---- localStorage ----

const RECORD_KEY = "sabi-detective:record";

export function readRecord(): PlayerRecord {
  try {
    const raw = window.localStorage.getItem(RECORD_KEY);
    return raw ? parseRecord(JSON.parse(raw)) : emptyRecord;
  } catch {
    return emptyRecord;
  }
}

export function writeRecord(record: PlayerRecord): void {
  try {
    window.localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable: the record lives in memory for this visit only.
  }
}
