// Run after `next build`. Confirms nothing that reveals the answer ships to the browser.
// Scans every client file: .next/static plus the prerendered HTML/RSC payloads.
// Covers every case: the answers come from each case_solutions insert in supabase/migrations.
// Locked clues (locked_clues / clue_unlocks inserts in supabase/) must not ship at all.
// Test-only data (supabase/migrations/*_test.sql, e.g. Case 99) must not be in the build at all
// unless it was built with NEXT_PUBLIC_ENABLE_TEST_CASE=1; even then only its public story may.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const root = process.cwd();
const sqlIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort()
        .map((f) => ({ file: join(dir, f).slice(root.length + 1), sql: readFileSync(join(dir, f), "utf8") }))
    : [];
const migrations = sqlIn(join(root, "supabase/migrations"));
// Seeds hold the public suspect and clue ids each case's answer must hide among.
const allSql = [...migrations, ...sqlIn(join(root, "supabase"))];

// ---- A small SQL reader: enough for the plain inserts in our migrations and seeds ----

// Quotes toggle string mode; an escaped '' toggles twice, so it stays inside the string.

// Drops "--" comments outside strings, so an apostrophe in a comment can't confuse the reader.
function stripComments(sql) {
  let out = "";
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    if (!inString && sql[i] === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
    } else if (sql[i] === "'") inString = !inString;
    out += sql[i] ?? "";
  }
  return out;
}

// Splits on top-level commas up to the bracket that closes `open`. Returns the parts and where it stopped.
function readList(sql, open) {
  const parts = [];
  let depth = 0;
  let inString = false;
  let start = open + 1;
  for (let i = open + 1; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'") inString = !inString;
    else if (inString) continue;
    else if (c === "(" || c === "[") depth++;
    else if ((c === ")" || c === "]") && depth > 0) depth--;
    else if (depth === 0 && (c === ")" || c === ",")) {
      parts.push(sql.slice(start, i).trim());
      start = i + 1;
      if (c === ")") return { parts, end: i };
    }
  }
  throw new Error("Unclosed bracket in SQL");
}

// Every row of every `insert into [public.]<table> (columns) values (...), (...)`, as {column: raw value}.
function insertRows(sql, table) {
  sql = stripComments(sql);
  const rows = [];
  for (const m of sql.matchAll(new RegExp(`insert\\s+into\\s+(?:public\\.)?${table}\\s*\\(`, "gi"))) {
    const cols = readList(sql, m.index + m[0].length - 1);
    const columns = cols.parts.map((c) => c.toLowerCase());
    let i = cols.end + 1;
    const valuesAt = sql.slice(i).search(/\S/);
    if (!/^values\b/i.test(sql.slice(i + valuesAt))) continue;
    i += valuesAt + "values".length;
    while (true) {
      while (/\s/.test(sql[i])) i++;
      if (sql[i] !== "(") break;
      const values = readList(sql, i);
      rows.push(Object.fromEntries(columns.map((c, k) => [c, values.parts[k] ?? ""])));
      i = values.end + 1;
      while (/\s/.test(sql[i])) i++;
      if (sql[i] !== ",") break;
      i++;
    }
  }
  return rows;
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const uuids = (s) => [...new Set((s ?? "").toLowerCase().match(UUID) ?? [])];
const sqlString = (v) => /^'([\s\S]*)'$/.exec(v ?? "")?.[1].replaceAll("''", "'") ?? null;

// ---- The answers, per case ----

// caseId -> { suspects: Set, clues: Set } of public ids. The answer ids are added in too.
const cases = new Map();
const caseIds = (caseId) => {
  if (!cases.has(caseId)) cases.set(caseId, { suspects: new Set(), clues: new Set() });
  return cases.get(caseId);
};

const resultTexts = new Set();
let answerIdCount = 0;
for (const { sql } of migrations) {
  for (const row of insertRows(sql, "case_solutions")) {
    const [caseId] = uuids(row.case_id);
    const suspects = uuids(row.solution_suspect_id);
    const clues = [...uuids(row.key_clue_ids), ...uuids(row.red_herring_clue_ids)];
    // The *_title columns (Case Cracked / Close Call / Missed It) are outcome names every player
    // sees, and the home screen shows them as verdict labels; they reveal nothing about the answer.
    // The *_text explanations do reveal it, so those must never ship.
    const texts = Object.entries(row)
      .filter(([column]) => column.endsWith("_text"))
      .map(([, value]) => sqlString(value))
      .filter(Boolean);
    if (!caseId || suspects.length === 0 || texts.length === 0) {
      console.error("Could not read a case_solutions row in supabase/migrations. Update this script.");
      process.exit(2);
    }
    for (const t of texts) resultTexts.add(t);
    const ids = caseIds(caseId);
    for (const id of suspects) ids.suspects.add(id);
    for (const id of clues) ids.clues.add(id);
    answerIdCount += suspects.length + clues.length;
  }
}
if (resultTexts.size === 0 || answerIdCount === 0) {
  console.error("Found no answer texts or answer ids in supabase/migrations. Update this script.");
  process.exit(2);
}

for (const { sql } of allSql) {
  for (const [table, kind] of [["suspects", "suspects"], ["clues", "clues"]]) {
    for (const row of insertRows(sql, table)) {
      const [id] = uuids(row.id);
      const [caseId] = uuids(row.case_id);
      if (id && caseId && cases.has(caseId)) caseIds(caseId)[kind].add(id);
    }
  }
}

// ---- Locked clues: hidden until the player unlocks them, so nothing about them may ship ----

const lockedIds = new Set();
const lockedTexts = new Set();
// Names of two words or more are checked as exact phrases; one word is too common to tell apart.
const lockedNames = new Set();
// Random file names under /art/locked/.
const lockedImages = new Set();
for (const { file, sql } of allSql) {
  for (const row of insertRows(sql, "locked_clues")) {
    const [id] = uuids(row.id);
    if (!id) {
      console.error(`Could not read a locked_clues row in ${file}. Update this script.`);
      process.exit(2);
    }
    lockedIds.add(id);
    const name = sqlString(row.name)?.trim();
    if (name && name.split(/\s+/).length >= 2) lockedNames.add(name);
    const text = sqlString(row.found_description);
    if (text) lockedTexts.add(text);
    const image = sqlString(row.icon_image_url);
    if (image) lockedImages.add(image.split("/").pop());
  }
  for (const row of insertRows(sql, "clue_unlocks")) {
    for (const id of uuids(row.unlocks_clue_id)) lockedIds.add(id);
  }
}

// In the SQL itself: a locked clue inserted into the public clues table is readable by anyone.
const failures = [];
for (const { file, sql } of allSql) {
  for (const row of insertRows(sql, "clues")) {
    for (const id of uuids(row.id)) {
      if (lockedIds.has(id)) failures.push(`${file}: inserts locked clue ${id} into the public clues table`);
    }
  }
}

// Check every run of 8 words in each text, so a leaked part of one is caught too
// (the "{accused}" text is split around the placeholder).
const RUN = 8;
const wordRuns = (text) =>
  text.split("{accused}").flatMap((part) => {
    const words = part.trim().split(/\s+/).filter(Boolean);
    if (words.length <= RUN) return words.length ? [words.join(" ")] : [];
    return words.slice(0, words.length - RUN + 1).map((_, i) => words.slice(i, i + RUN).join(" "));
  });
const textNeedles = [...new Set([...resultTexts, ...lockedTexts].flatMap(wordRuns)), ...lockedNames];

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
  "locked_clues",
  "clue_unlocks",
  "source_clue_ids",
  "unlocks_clue_id",
];

const secretValues = [process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()].filter(Boolean);

// ---- Test-only cases (Vercel Preview) ----
// Their data is in supabase/migrations/*_test.sql. With the flag off, none of it may be anywhere
// in .next, browser or server. With it on, its public offline copy may appear; the locked clue
// and answer checks above still apply to it in full.
const testCaseOn = process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1";
const testIds = new Set();
const testText = new Set(["Test Locker", "TEST ONLY"]);
for (const { file, sql } of migrations) {
  if (!/_test\.sql$/.test(file)) continue;
  for (const id of uuids(sql)) testIds.add(id);
  for (const row of insertRows(sql, "cases")) testText.add(sqlString(row.title));
  for (const table of ["suspects", "clues", "locked_clues"]) {
    for (const row of insertRows(sql, table)) testText.add(sqlString(row.name));
  }
}
testText.delete(null);

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

for (const file of clientFiles) {
  const body = readFileSync(file, "utf8");
  const lower = body.toLowerCase();
  const rel = file.slice(root.length + 1);
  for (const n of [...textNeedles, ...fieldNeedles]) {
    if (body.includes(n)) failures.push(`${rel}: contains "${n.slice(0, 50)}"`);
  }
  for (const v of secretValues) if (body.includes(v)) failures.push(`${rel}: contains the service role key value`);
  // Locked clue ids and image names may not appear at all, not even alongside the others.
  for (const id of lockedIds) if (lower.includes(id)) failures.push(`${rel}: contains locked clue id ${id}`);
  for (const image of lockedImages) if (body.includes(image)) failures.push(`${rel}: contains locked clue image ${image}`);
  // Public ids: each one may appear (players see every suspect and clue), but the answer
  // must not be singled out, so a file holding one of a case's suspect/clue ids must hold them all.
  for (const [caseId, groups] of cases) {
    for (const [label, set] of [["suspect", groups.suspects], ["clue", groups.clues]]) {
      // Locked clue ids (which may be key clues) are left out: they must never appear at all,
      // which is checked above, while public ids must appear all together or not at all.
      const ids = [...set].filter((id) => !lockedIds.has(id));
      const present = ids.filter((id) => lower.includes(id));
      if (present.length === 0) continue;
      if (ids.length < 2) {
        failures.push(`${rel}: contains a ${label} id for case ${caseId}, but its other ${label} ids aren't in supabase/*.sql, so this can't be shown to be safe`);
      } else if (present.length < ids.length) {
        failures.push(`${rel}: contains only some ${label} ids for case ${caseId} (${present.length}/${ids.length}), which could single out the answer`);
      }
    }
  }
}

if (!testCaseOn) {
  const buildFiles = walk(join(root, ".next")).filter(
    (p) => !p.includes(`${sep}cache${sep}`) && /\.(js|mjs|cjs|json|html|rsc|body|css|map|txt)$/.test(p),
  );
  for (const file of buildFiles) {
    const body = readFileSync(file, "utf8");
    const lower = body.toLowerCase();
    const rel = file.slice(root.length + 1);
    for (const t of testText) if (body.includes(t)) failures.push(`${rel}: contains test-only "${t}" (NEXT_PUBLIC_ENABLE_TEST_CASE is off)`);
    for (const id of testIds) if (lower.includes(id)) failures.push(`${rel}: contains test-only id ${id} (NEXT_PUBLIC_ENABLE_TEST_CASE is off)`);
  }
  console.log(`Test case flag off: scanned ${buildFiles.length} build files (browser and server) for ${testText.size} test-only strings and ${testIds.size} test-only ids.`);
} else {
  console.log("Test case flag on: its public story may appear; locked clue and answer checks still apply.");
}

console.log(`Scanned ${clientFiles.length} client files for ${cases.size} case(s): ${textNeedles.length} result-text and locked-clue snippets, ${answerIdCount} answer ids, ${lockedIds.size} locked clue ids, ${lockedImages.size} locked images, ${fieldNeedles.length} answer field names${secretValues.length ? ", the service key value" : ""}.`);
if (failures.length) {
  console.error(`FAIL: ${failures.length} problem(s):\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS: no answer data found in client files.");
