import { case1Fallback } from "@/data/case1-fallback";
import { outcomes } from "@/data/outcomes";
import { supabase } from "@/lib/supabase";
import type { Accusation, CaseBundle, Clue, Progress, ResultTier } from "@/lib/types";

export type LoadedCase = CaseBundle & { source: "supabase" | "local" };

const fallbacks: Record<number, CaseBundle> = { 1: case1Fallback };

async function fetchFromSupabase(caseNumber: number): Promise<CaseBundle | null> {
  if (!supabase) return null;

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("case_number", caseNumber)
    .maybeSingle();
  if (caseError) throw caseError;
  if (!caseData) return null;

  const [suspectsRes, cluesRes] = await Promise.all([
    supabase.from("suspects").select("*").eq("case_id", caseData.id).order("name"),
    supabase.from("clues").select("*").eq("case_id", caseData.id).order("name"),
  ]);
  if (suspectsRes.error) throw suspectsRes.error;
  if (cluesRes.error) throw cluesRes.error;

  return { caseData, suspects: suspectsRes.data, clues: cluesRes.data };
}

export async function loadCase(caseNumber: number): Promise<LoadedCase> {
  try {
    const remote = await fetchFromSupabase(caseNumber);
    if (remote) return { ...remote, source: "supabase" };
  } catch (err) {
    console.warn("Could not load case from Supabase, using local data.", err);
  }
  const local = fallbacks[caseNumber];
  if (!local) throw new Error(`Case ${caseNumber} not found.`);
  return { ...local, source: "local" };
}

export function scoreAccusation(
  bundle: CaseBundle,
  accusation: Accusation,
): ResultTier {
  const { caseData, clues } = bundle;
  if (accusation.suspectId !== caseData.solution_suspect_id) return "missed";

  const keyEvidence = outcomes[caseData.case_number]?.keyEvidence ?? [];
  const citedNames = new Set(
    clues.filter((c) => accusation.citedClueIds.includes(c.id)).map((c) => c.name),
  );
  const citedKeyCount = keyEvidence.filter((name) => citedNames.has(name)).length;

  if (keyEvidence.length > 0 && citedKeyCount === keyEvidence.length) return "cracked";
  return "close";
}

export function collectedClues(clues: Clue[], progress: Progress): Clue[] {
  return clues.filter((c) => progress.foundClueIds.includes(c.id));
}

// ---- localStorage persistence ----

export const emptyProgress: Progress = { foundClueIds: [], contradictions: [] };

const storageKey = (caseNumber: number) => `sabi-detective:case-${caseNumber}:progress`;

export function readProgress(caseNumber: number): Progress {
  try {
    const raw = window.localStorage.getItem(storageKey(caseNumber));
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      foundClueIds: Array.isArray(parsed.foundClueIds) ? parsed.foundClueIds : [],
      contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
    };
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(caseNumber: number, progress: Progress): void {
  try {
    window.localStorage.setItem(storageKey(caseNumber), JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode etc.): progress stays in memory only.
  }
}

export function clearProgress(caseNumber: number): void {
  try {
    window.localStorage.removeItem(storageKey(caseNumber));
  } catch {
    // ignore
  }
}
