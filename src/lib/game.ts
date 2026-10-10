import { case1Fallback } from "@/data/case1-fallback";
import { supabase } from "@/lib/supabase";
import type { CaseBundle, Clue, Contradiction, Progress, SavedResult } from "@/lib/types";

export type LoadedCase = CaseBundle & { source: "supabase" | "local" };

const fallbacks: Record<number, CaseBundle> = { 1: case1Fallback };

// Explicit columns: the public tables must never be asked for anything answer-related.
const CASE_COLUMNS = "id, case_number, title, briefing_text, scene_image_url, release_date";
const SUSPECT_COLUMNS = "id, case_id, name, portrait_image_url, connection, motive";
const CLUE_COLUMNS = "id, case_id, name, icon_image_url, found_description";

async function fetchFromSupabase(caseNumber: number): Promise<CaseBundle | null> {
  if (!supabase) return null;

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select(CASE_COLUMNS)
    .eq("case_number", caseNumber)
    .maybeSingle();
  if (caseError) throw caseError;
  if (!caseData) return null;

  const [suspectsRes, cluesRes] = await Promise.all([
    supabase.from("suspects").select(SUSPECT_COLUMNS).eq("case_id", caseData.id).order("name"),
    supabase.from("clues").select(CLUE_COLUMNS).eq("case_id", caseData.id).order("name"),
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

export function collectedClues(clues: Clue[], progress: Progress): Clue[] {
  return clues.filter((c) => progress.foundClueIds.includes(c.id));
}

// ---- localStorage persistence ----

export const emptyProgress: Progress = { foundClueIds: [], contradictions: [] };

const progressKey = (caseNumber: number) => `sabi-detective:case-${caseNumber}:progress`;
const resultKey = (caseNumber: number) => `sabi-detective:case-${caseNumber}:result`;

const isContradiction = (c: unknown): c is Contradiction =>
  typeof c === "object" &&
  c !== null &&
  typeof (c as Contradiction).questionId === "string" &&
  typeof (c as Contradiction).suspectId === "string";

export function readProgress(caseNumber: number): Progress {
  try {
    const raw = window.localStorage.getItem(progressKey(caseNumber));
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      foundClueIds: Array.isArray(parsed.foundClueIds) ? parsed.foundClueIds : [],
      // Entries saved before contradictions had ids are dropped.
      contradictions: Array.isArray(parsed.contradictions)
        ? parsed.contradictions.filter(isContradiction)
        : [],
    };
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(caseNumber: number, progress: Progress): void {
  try {
    window.localStorage.setItem(progressKey(caseNumber), JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode etc.): progress stays in memory only.
  }
}

// The saved result is only for showing the Result screen again after a refresh.
// It is not trusted for anything else.
export function readResult(caseNumber: number): SavedResult | null {
  try {
    const raw = window.localStorage.getItem(resultKey(caseNumber));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedResult;
    const ok =
      typeof parsed?.result?.outcome === "string" &&
      typeof parsed.result.title === "string" &&
      typeof parsed.result.explanation === "string" &&
      Array.isArray(parsed.result.feedback) &&
      typeof parsed.accusation?.suspectId === "string" &&
      Array.isArray(parsed.accusation.citedClueIds);
    return ok ? parsed : null;
  } catch {
    return null;
  }
}

export function writeResult(caseNumber: number, saved: SavedResult): void {
  try {
    window.localStorage.setItem(resultKey(caseNumber), JSON.stringify(saved));
  } catch {
    // ignore
  }
}

export function clearProgress(caseNumber: number): void {
  try {
    window.localStorage.removeItem(progressKey(caseNumber));
    window.localStorage.removeItem(resultKey(caseNumber));
  } catch {
    // ignore
  }
}
