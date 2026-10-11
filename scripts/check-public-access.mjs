// Uses ONLY the public anon key to try to read the answer. Read-only: it never writes.
// Run with: npm run check:public-access
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
if (!url || !anonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local.");
  process.exit(2);
}

const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

async function probe(label, path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const rows = Array.isArray(body) ? body : null;
  const exposed = res.ok && rows !== null && rows.length > 0;
  let detail;
  if (exposed) detail = `EXPOSED: ${rows.length} row(s) readable`;
  else if (res.ok) detail = "denied (0 rows visible)";
  else if (body?.code === "PGRST205") {
    console.log(`SKIP  ${label}: table not found, so it can't be checked yet`);
    return { exposed: false, status: res.status, code: body.code };
  }
  else detail = `denied (HTTP ${res.status}${body?.code ? `, ${body.code}` : ""}${body?.message ? `: ${body.message}` : ""})`;
  console.log(`${exposed ? "FAIL" : "PASS"}  ${label}: ${detail}`);
  return { exposed, status: res.status, code: body?.code };
}

const results = [
  await probe("case_solutions table", "case_solutions?select=*"),
  await probe("cases.solution_suspect_id", "cases?select=solution_suspect_id&solution_suspect_id=not.is.null"),
  await probe("clues.is_red_herring", "clues?select=is_red_herring"),
  await probe("locked_clues table", "locked_clues?select=*"),
  await probe("clue_unlocks table", "clue_unlocks?select=*"),
];

const missingTable = results[0].code === "PGRST205";
if (missingTable) console.log("NOTE  case_solutions does not exist yet: Stage 1 (002) has not been applied.");
if (results[3].code === "PGRST205" || results[4].code === "PGRST205") {
  console.log("NOTE  locked_clues or clue_unlocks does not exist yet: 007_locked_clues.sql has not been applied.");
}

process.exit(results.some((r) => r.exposed) ? 1 : 0);
