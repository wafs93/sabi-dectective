import { caseFallback } from "@/data/cases";
import { supabase } from "@/lib/supabase";
import type {
  CaseBundle,
  Clue,
  Contradiction,
  Progress,
  SavedResult,
  UnlockedClue,
} from "@/lib/types";

export type LoadedCase = CaseBundle & { source: "supabase" | "local" };

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
  const local = caseFallback(caseNumber);
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

// Limits for unlocked clues read back from storage. Well above any real case.
export const MAX_UNLOCKED_CLUES = 50;
const MAX_NAME = 200;
const MAX_DESCRIPTION = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Locked clue images live at random names under public/art/locked/.
const LOCKED_IMAGE_RE = /^\/art\/locked\/[A-Za-z0-9_-]{1,100}\.(?:jpe?g|png|webp)$/;

const isOptionalText = (v: unknown, max: number): v is string | null =>
  v === null || (typeof v === "string" && v.length <= max);

function isUnlockedClue(v: unknown): v is UnlockedClue {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    UUID_RE.test(c.id) &&
    typeof c.name === "string" &&
    c.name.trim().length > 0 &&
    c.name.length <= MAX_NAME &&
    isOptionalText(c.found_description, MAX_DESCRIPTION) &&
    (c.icon_image_url === null ||
      (typeof c.icon_image_url === "string" && LOCKED_IMAGE_RE.test(c.icon_image_url)))
  );
}

// Unlocked clues from storage are untrusted: anything malformed is dropped, as are
// repeats of an id already seen, and only the first MAX_UNLOCKED_CLUES are kept.
// Only the four known fields are copied, so nothing else rides along.
export function parseUnlockedClues(raw: unknown): UnlockedClue[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const clean: UnlockedClue[] = [];
  for (const v of raw) {
    if (clean.length >= MAX_UNLOCKED_CLUES) break;
    if (!isUnlockedClue(v)) continue;
    const id = v.id.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    clean.push({
      id,
      name: v.name,
      found_description: v.found_description,
      icon_image_url: v.icon_image_url,
    });
  }
  return clean;
}

export function readProgress(caseNumber: number): Progress {
  try {
    const raw = window.localStorage.getItem(progressKey(caseNumber));
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const unlockedClues = parseUnlockedClues(parsed.unlockedClues);
    return {
      foundClueIds: Array.isArray(parsed.foundClueIds) ? parsed.foundClueIds : [],
      // Entries saved before contradictions had ids are dropped.
      contradictions: Array.isArray(parsed.contradictions)
        ? parsed.contradictions.filter(isContradiction)
        : [],
      // Absent unless something is unlocked, so Case 1 and Case 2 progress is unchanged.
      ...(unlockedClues.length > 0 && { unlockedClues }),
    };
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(caseNumber: number, progress: Progress): void {
  // With nothing unlocked the field is left out, so the stored text is exactly as before.
  const { unlockedClues, ...rest } = progress;
  const stored = unlockedClues && unlockedClues.length > 0 ? { ...rest, unlockedClues } : rest;
  try {
    window.localStorage.setItem(progressKey(caseNumber), JSON.stringify(stored));
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
