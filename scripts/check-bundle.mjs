// Run after `next build`. Confirms nothing that reveals the answer ships to the browser.
// Scans every client file: .next/static plus the prerendered HTML/RSC payloads.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sql = readFileSync(join(root, "supabase/migrations/002_private_solutions.sql"), "utf8");
const seed = readFileSync(join(root, "supabase/seed.sql"), "utf8");

// Result titles and texts: every quoted string in the 002 insert that isn't a uuid.
const insert = sql.slice(sql.indexOf("insert into public.case_solutions"));
const resultTexts = [...insert.matchAll(/'((?:[^']|'')+)'/g)]
  .map((m) => m[1].replaceAll("''", "'"))
  .filter((s) => !/^[0-9a-f-]{36}$/.test(s) && s !== "{}");
// Check a distinctive slice of each long text (the "{accused}" text is split around the placeholder).
const textNeedles = resultTexts.flatMap((t) =>
  t.length < 30 ? [t] : t.split("{accused}").map((part) => part.trim().slice(0, 60)).filter(Boolean),
);

const fieldNeedles = [
  "solution_suspect_id",
  "is_red_herring",
  "key_clue_ids",
  "red_herring_clue_ids",
  "case_solutions",
  "solutionSuspectId",
  "keyClueIds",
  "keyEvidence",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const secretValues = [process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()].filter(Boolean);

// Public ids: each one may appear (players see every suspect and clue), but the answer
// must not be singled out, so a file holding one suspect/clue id must hold them all.
const uuids = (s) => [...new Set(s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g))];
const suspectIds = uuids(seed).filter((id) => id.startsWith("22222222"));
const clueIds = uuids(seed).filter((id) => id.startsWith("33333333"));

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const clientFiles = [
  ...walk(join(root, ".next/static")),
  ...walk(join(root, ".next/server/app")).filter((p) => /\.(html|rsc|body)$/.test(p)),
].filter((p) => /\.(js|html|rsc|body|json|css)$/.test(p));

if (clientFiles.length === 0) {
  console.error("No build output found. Run `npm run build` first.");
  process.exit(2);
}

const failures = [];
for (const file of clientFiles) {
  const body = readFileSync(file, "utf8");
  const rel = file.slice(root.length + 1);
  for (const n of [...textNeedles, ...fieldNeedles]) {
    if (body.includes(n)) failures.push(`${rel}: contains "${n.slice(0, 50)}"`);
  }
  for (const v of secretValues) if (body.includes(v)) failures.push(`${rel}: contains the service role key value`);
  for (const [label, ids] of [["suspect", suspectIds], ["clue", clueIds]]) {
    const present = ids.filter((id) => body.includes(id));
    if (present.length > 0 && present.length < ids.length) {
      failures.push(`${rel}: contains only some ${label} ids (${present.length}/${ids.length}), which could single out the answer`);
    }
  }
}

console.log(`Scanned ${clientFiles.length} client files for ${textNeedles.length} result-text snippets, ${fieldNeedles.length} answer field names${secretValues.length ? ", the service key value" : ""}, and answer-revealing id patterns.`);
if (failures.length) {
  console.error(`FAIL: ${failures.length} problem(s):\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS: no answer data found in client files.");
