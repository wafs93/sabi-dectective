import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { ScoringData } from "@/server/accuse";

type SolutionRow = {
  solution_suspect_id: string;
  key_clue_ids: string[];
  red_herring_clue_ids: string[];
  cracked_title: string;
  cracked_text: string;
  close_title: string;
  close_text: string;
  missed_title: string;
  missed_text: string;
};

// Reads the private case_solutions table with the service role key.
// The key is read here, at request time, and never leaves the server.
export async function loadScoringData(caseId: string): Promise<ScoringData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) throw new Error("Supabase service credentials are not configured.");

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [solutionRes, suspectsRes, cluesRes] = await Promise.all([
    db.from("case_solutions").select("*").eq("case_id", caseId).maybeSingle<SolutionRow>(),
    db.from("suspects").select("id, name").eq("case_id", caseId),
    db.from("clues").select("id").eq("case_id", caseId),
  ]);
  if (solutionRes.error) throw new Error(`case_solutions: ${solutionRes.error.message}`);
  if (suspectsRes.error) throw new Error(`suspects: ${suspectsRes.error.message}`);
  if (cluesRes.error) throw new Error(`clues: ${cluesRes.error.message}`);

  const row = solutionRes.data;
  if (!row) return null;

  return {
    solution: {
      solutionSuspectId: row.solution_suspect_id,
      keyClueIds: row.key_clue_ids,
      redHerringClueIds: row.red_herring_clue_ids,
      texts: {
        cracked: { title: row.cracked_title, text: row.cracked_text },
        close: { title: row.close_title, text: row.close_text },
        missed: { title: row.missed_title, text: row.missed_text },
      },
    },
    suspects: suspectsRes.data,
    clueIds: cluesRes.data.map((c) => c.id),
  };
}
