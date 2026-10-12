import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repo = process.cwd();
const migration = readFileSync(join(repo, "supabase/migrations/007_locked_clues.sql"), "utf8");

// A made-up locked clue (Case 99 style), for a throwaway copy of supabase/ only.
const LOCKED_ID = "33333333-3333-4333-8333-000000009904";
const LOCKED_SQL = `
insert into public.locked_clues (id, case_id, name, found_description, icon_image_url)
values (
  '${LOCKED_ID}',
  '11111111-1111-4111-8111-000000000099',
  'Test locked confession note',
  'TEST ONLY. Fake locked text: the pretend suspect wrote a pretend note about the pretend locker.',
  '/art/locked/q7Zt4pLx9.jpg'
);
insert into public.clue_unlocks (case_id, kind, suspect_id, source_clue_ids, unlocks_clue_id)
values (
  '11111111-1111-4111-8111-000000000099', 'confront', '22222222-2222-4222-8222-000000009901',
  array['33333333-3333-4333-8333-000000009903']::uuid[], '${LOCKED_ID}'
);
`;

// Runs scripts/check-bundle.mjs against a tiny fake build: the real supabase/ folder,
// optional extra SQL, and one browser file with the given contents.
let dirs: string[] = [];
afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
  dirs = [];
});
function checkBundle({ extraSql = "", browserFile = "console.log('hello');" } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sabi-check-"));
  dirs.push(dir);
  cpSync(join(repo, "supabase"), join(dir, "supabase"), { recursive: true });
  if (extraSql) writeFileSync(join(dir, "supabase/migrations/900_test.sql"), extraSql);
  mkdirSync(join(dir, ".next/static/chunks"), { recursive: true });
  writeFileSync(join(dir, ".next/static/chunks/app.js"), browserFile);
  const env = { ...process.env };
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  const r = spawnSync(process.execPath, [join(repo, "scripts/check-bundle.mjs")], { cwd: dir, env, encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

describe("migration 007_locked_clues.sql", () => {
  it("creates the two private tables, and nothing else", () => {
    expect(migration).toMatch(/create table if not exists public\.locked_clues \(/);
    expect(migration).toMatch(/create table if not exists public\.clue_unlocks \(/);
    expect(migration.match(/create table/g)).toHaveLength(2);
  });

  it("locks both tables down exactly like case_solutions", () => {
    for (const t of ["locked_clues", "clue_unlocks"]) {
      expect(migration).toContain(`alter table public.${t} enable row level security;`);
      expect(migration).toContain(`revoke all on table public.${t} from anon, authenticated;`);
    }
    expect(migration).not.toMatch(/create policy|grant /i);
  });

  it("creates no rows and leaves existing tables alone", () => {
    const sql = migration.replace(/--.*$/gm, "");
    // Every statement creates, locks down or revokes; none writes or removes anything.
    const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
    expect(statements).toHaveLength(8);
    for (const s of statements) expect(s).toMatch(/^(create table if not exists|create index if not exists|alter table|revoke all)\b/);
    // The only ALTERs are turning on RLS for the two new tables.
    const alters = sql.match(/alter table [^;]+;/gi) ?? [];
    expect(alters).toHaveLength(2);
    for (const a of alters) expect(a).toMatch(/public\.(locked_clues|clue_unlocks) enable row level security/);
  });

  it("checks the rule shapes and the image path", () => {
    expect(migration).toContain("kind = 'confront' and suspect_id is not null and cardinality(source_clue_ids) = 1");
    expect(migration).toMatch(/kind = 'combine'\s+and suspect_id is null\s+and cardinality\(source_clue_ids\) = 2\s+and source_clue_ids\[1\] <> source_clue_ids\[2\]/);
    expect(migration).toContain("'^/art/locked/[A-Za-z0-9_-]{1,100}\\.(jpe?g|png|webp)$'");
  });
});

describe("scripts/check-public-access.mjs", () => {
  it("probes both new tables with the public key", () => {
    const script = readFileSync(join(repo, "scripts/check-public-access.mjs"), "utf8");
    expect(script).toContain('probe("locked_clues table", "locked_clues?select=*")');
    expect(script).toContain('probe("clue_unlocks table", "clue_unlocks?select=*")');
  });
});

describe("scripts/check-bundle.mjs and locked clues", () => {
  it("passes with no locked clues in the SQL", () => {
    const r = checkBundle();
    expect(r.out).toContain("0 locked clue ids");
    expect(r.code).toBe(0);
  });

  it("passes with a locked clue in the SQL that doesn't ship", () => {
    const r = checkBundle({ extraSql: LOCKED_SQL });
    expect(r.out).toContain("1 locked clue ids, 1 locked images");
    expect(r.code).toBe(0);
  });

  it.each([
    ["part of its description", 'var a="the pretend suspect wrote a pretend note about the";'],
    ["its name", 'var a="Test locked confession note";'],
    ["its id", `var a="${LOCKED_ID}";`],
    ["its id in capitals", `var a="${LOCKED_ID.toUpperCase()}";`],
    ["its image file name", 'var a="/art/locked/q7Zt4pLx9.jpg";'],
    ["the table name locked_clues", 'var a="locked_clues";'],
    ["the table name clue_unlocks", 'var a="clue_unlocks";'],
    ["the field name source_clue_ids", 'var a="source_clue_ids";'],
  ])("fails when a browser file holds %s", (_, leak) => {
    const r = checkBundle({ extraSql: LOCKED_SQL, browserFile: leak });
    expect(r.out).toContain("FAIL");
    expect(r.code).toBe(1);
  });

  it("passes with the public locked-clue summary in a browser file", () => {
    // What the browser may know for a switched-on case: how many clues are hidden and how
    // each is revealed, plus the slot labels. Never names, ids, images or text.
    const summary = 'var s={1:false,2:false,99:{hidden:["confront","combine"]}};' +
      'var l={confront:{icon:"🗣️",label:"Revealed by questioning"},combine:{icon:"🔗",label:"Revealed by connecting clues"}};' +
      'var t="Hidden evidence ("+2+" left)";';
    const r = checkBundle({ extraSql: LOCKED_SQL, browserFile: summary });
    expect(r.out).toContain("1 locked clue ids");
    expect(r.code).toBe(0);
  });

  it("still fails when the summary is joined by a locked clue's details", () => {
    const summary = 'var s={99:{hidden:["confront","combine"]}};';
    for (const leak of [
      'var n="Test locked confession note";',
      `var i="${LOCKED_ID}";`,
      'var m="q7Zt4pLx9.jpg";',
      'var d="the pretend suspect wrote a pretend note about the";',
    ]) {
      expect(checkBundle({ extraSql: LOCKED_SQL, browserFile: summary + leak }).code).toBe(1);
    }
  });

  it("bans the table and field names even with no locked clues yet", () => {
    for (const name of ["locked_clues", "clue_unlocks", "source_clue_ids", "unlocks_clue_id"]) {
      expect(checkBundle({ browserFile: `var a="${name}";` }).code).toBe(1);
    }
  });

  it("fails when a locked clue is inserted into the public clues table", () => {
    const leak = `${LOCKED_SQL}
insert into public.clues (id, case_id, name, icon_image_url, found_description)
values ('${LOCKED_ID}', '11111111-1111-4111-8111-000000000099', 'oops', null, 'oops');`;
    const r = checkBundle({ extraSql: leak });
    expect(r.out).toContain(`inserts locked clue ${LOCKED_ID} into the public clues table`);
    expect(r.code).toBe(1);
  });

  it("stops when a locked_clues row can't be read", () => {
    const r = checkBundle({
      extraSql: "insert into public.locked_clues (id, case_id, name) values (null, null, 'x');",
    });
    expect(r.out).toContain("Could not read a locked_clues row");
    expect(r.code).toBe(2);
  });
});
