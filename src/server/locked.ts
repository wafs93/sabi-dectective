import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UnlockRule } from "@/server/unlocks";

// Reads the private locked_clues and clue_unlocks tables with the service role key.
// The key is read here, at request time, and never leaves the server.

export type LockedClue = {
  id: string;
  name: string;
  found_description: string | null;
  icon_image_url: string | null;
};

export type UnlockData = {
  rules: UnlockRule[];
  lockedClues: LockedClue[];
};

type RuleRow = {
  kind: string;
  suspect_id: string | null;
  source_clue_ids: string[] | null;
  unlocks_clue_id: string;
};

// Until 007_locked_clues.sql is run, the tables don't exist. That means "no locked clues",
// so accusations and unlock requests keep working instead of failing.
export function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

// Turns clue_unlocks rows into rules. Rows that don't fit either shape are skipped
// (the table's check constraint should already prevent them).
export function rulesFromRows(rows: RuleRow[]): UnlockRule[] {
  const rules: UnlockRule[] = [];
  for (const r of rows) {
    const sources = r.source_clue_ids ?? [];
    if (r.kind === "confront" && r.suspect_id && sources.length === 1) {
      rules.push({ kind: "confront", suspectId: r.suspect_id, clueId: sources[0], unlocksClueId: r.unlocks_clue_id });
    } else if (r.kind === "combine" && sources.length === 2 && sources[0] !== sources[1]) {
      rules.push({ kind: "combine", clueIds: [sources[0], sources[1]], unlocksClueId: r.unlocks_clue_id });
    }
  }
  return rules;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) throw new Error("Supabase service credentials are not configured.");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// The case's rules and locked clue content, or null if the case doesn't exist.
export async function loadUnlockData(caseId: string): Promise<UnlockData | null> {
  const db = serviceClient();
  const [caseRes, rulesRes, lockedRes] = await Promise.all([
    db.from("cases").select("id").eq("id", caseId).maybeSingle(),
    db
      .from("clue_unlocks")
      .select("kind, suspect_id, source_clue_ids, unlocks_clue_id")
      .eq("case_id", caseId),
    db
      .from("locked_clues")
      .select("id, name, found_description, icon_image_url")
      .eq("case_id", caseId),
  ]);
  if (caseRes.error) throw new Error(`cases: ${caseRes.error.message}`);
  if (!caseRes.data) return null;
  if (rulesRes.error && !isMissingTable(rulesRes.error)) throw new Error(`clue_unlocks: ${rulesRes.error.message}`);
  if (lockedRes.error && !isMissingTable(lockedRes.error)) throw new Error(`locked_clues: ${lockedRes.error.message}`);

  return {
    rules: rulesRes.error ? [] : rulesFromRows(rulesRes.data as RuleRow[]),
    lockedClues: lockedRes.error ? [] : (lockedRes.data as LockedClue[]),
  };
}

// Just the ids of a case's locked clues, so an accusation may cite an unlocked one.
export async function loadLockedClueIds(db: SupabaseClient, caseId: string): Promise<string[]> {
  const res = await db.from("locked_clues").select("id").eq("case_id", caseId);
  if (res.error) {
    if (isMissingTable(res.error)) return [];
    throw new Error(`locked_clues: ${res.error.message}`);
  }
  return (res.data as { id: string }[]).map((c) => c.id);
}
