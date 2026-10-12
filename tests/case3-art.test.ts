import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CASE3_CLUES, CASE3_ID, CASE3_SUSPECTS, case3Fallback } from "@/data/case3/case3";
import { case3Art } from "@/data/case3/art";
import { insertRows, sqlString, uuids } from "./helpers/sql";

const repo = process.cwd();
const art = (f: string) => join(repo, "public/art", f);
const sql011 = readFileSync(join(repo, "supabase/migrations/011_case3_private.sql"), "utf8");
const sql012 = readFileSync(join(repo, "supabase/migrations/012_case3_locked_images.sql"), "utf8");
const artSource = readFileSync(join(repo, "src/data/case3/art.ts"), "utf8");
const noComments = (sql: string) => sql.replace(/--.*$/gm, "");

// Width and height from a JPEG's start-of-frame marker.
function jpegSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  expect(b[0] === 0xff && b[1] === 0xd8, `${file} is a JPEG`).toBe(true);
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1];
    const length = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  throw new Error(`No frame header in ${file}`);
}

// The 4 final-proof clues (F1-F4 in 011) and the picture each one gets.
const FINAL_PROOF: Record<string, string> = {
  "cd32e24c-74e2-4299-824e-9dc30b828e56": "Sanni's login trail",
  "4aed047f-0c28-4496-b4f0-683df22c1601": "Land purchase record",
  "43011ef1-6601-4b73-8b1e-bad6f9843dba": "Office line trace",
  "e1edc07e-a4ac-4b39-b744-f7c56a65b64a": "Signed Special Projects order",
};
// id -> image path, read from the update statements in 012.
const updates = [...noComments(sql012).matchAll(/update\s+public\.locked_clues\s+set\s+icon_image_url\s*=\s*'([^']*)'\s+where\s+id\s*=\s*'([^']*)'\s+and\s+case_id\s*=\s*'([^']*)'\s*;/gi)].map(
  (m) => ({ image: m[1], id: m[2], caseId: m[3] }),
);
const LOCKED_CHECK = /^\/art\/locked\/[A-Za-z0-9_-]{1,100}\.(jpe?g|png|webp)$/;

describe("Case 3 art files", () => {
  const tall = ["scene-lekki-duplex", ...["kelvin", "madu", "sanni", "bisola", "yinka", "aisha", "segun", "chidi"].map((n) => `portrait-${n}`)];
  const clues = ["dating-profiles", "phone-chat", "donation-list", "bank-statement", "receipt-book", "flag-memo", "campaign-filing", "raid-report"].map((n) => `clue-${n}`);
  const files = [
    ...tall.map((name) => ({ file: art(`${name}.jpg`), width: 768, height: 1152 })),
    ...clues.map((name) => ({ file: art(`${name}.jpg`), width: 1236, height: 604 })),
    // The signed order keeps a taller crop so the signature at the bottom stays in.
    ...updates.map((u) => ({ file: join(repo, "public", u.image), width: 1236, height: u.id.startsWith("e1edc07e") ? 690 : 604 })),
  ];

  it("has all 21 pictures", () => {
    expect(files).toHaveLength(21);
    for (const { file } of files) expect(existsSync(file), file).toBe(true);
  });

  it("keeps every picture a real JPEG under 100KB, at its expected size", () => {
    for (const { file, width, height } of files) {
      expect(statSync(file).size, file).toBeLessThan(100_000);
      expect(jpegSize(file), file).toEqual({ width, height });
    }
  });

  it("imports exactly the 17 public pictures in the art map, and none of the locked ones", () => {
    const imported = [...artSource.matchAll(/public\/art\/([^"]+)"/g)].map((m) => m[1]).sort();
    expect(imported).toEqual([...tall, ...clues].map((n) => `${n}.jpg`).sort());
    expect(artSource).not.toContain("locked");
  });
});

describe("Case 3 art map", () => {
  it("has a portrait for every suspect and an image for every visible clue, keyed by the real ids", () => {
    expect(Object.keys(case3Art.portraits).sort()).toEqual(Object.values(CASE3_SUSPECTS).sort());
    expect(Object.keys(case3Art.clues).sort()).toEqual(Object.values(CASE3_CLUES).sort());
    expect(case3Fallback.suspects.map((s) => s.id).sort()).toEqual(Object.keys(case3Art.portraits).sort());
    expect(case3Fallback.clues.map((c) => c.id).sort()).toEqual(Object.keys(case3Art.clues).sort());
  });

  it("matches each portrait and clue picture to the right name", () => {
    // Next gives an object with src; the test runner gives the path itself.
    const pictureOf = (data: unknown) => String((data as { src?: string }).src ?? data).split("/").pop()!;
    for (const [key, id] of Object.entries(CASE3_SUSPECTS)) {
      expect(pictureOf(case3Art.portraits[id])).toContain(`portrait-${key}`);
    }
    const clueFiles: Record<string, string> = {
      V1: "dating-profiles", V2: "phone-chat", V3: "donation-list", V4: "bank-statement",
      V5: "receipt-book", V6: "flag-memo", V7: "campaign-filing", V8: "raid-report",
    };
    for (const [key, id] of Object.entries(CASE3_CLUES)) {
      expect(pictureOf(case3Art.clues[id])).toContain(`clue-${clueFiles[key]}`);
    }
  });

  it("has one hotspot per visible clue, inside the scene", () => {
    expect(case3Art.hotspots.map((h) => h.clueId).sort()).toEqual(Object.values(CASE3_CLUES).sort());
    for (const h of case3Art.hotspots) {
      // Wide enough that a 44px spot stays inside a 360px scene.
      expect(h.x).toBeGreaterThanOrEqual(7);
      expect(h.x).toBeLessThanOrEqual(93);
      expect(h.y).toBeGreaterThan(5);
      expect(h.y).toBeLessThan(95);
      expect(h.label).toBeTruthy();
    }
  });

  it("keeps hotspots from overlapping on the narrowest phone (360px wide scene, 2:3)", () => {
    const width = 360;
    const height = width * 1.5;
    const diameter = (size: number) => Math.max(44, (size / 100) * width);
    const spots = case3Art.hotspots;
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const [a, b] = [spots[i], spots[j]];
        const distance = Math.hypot(((a.x - b.x) / 100) * width, ((a.y - b.y) / 100) * height);
        expect(distance).toBeGreaterThan((diameter(a.size) + diameter(b.size)) / 2);
      }
    }
  });

  it("gives Home an intro line that doesn't name the culprit", () => {
    expect(case3Art.intro).toBeTruthy();
    expect(case3Art.intro).not.toMatch(/Madu|Ifeanyi|Honourable|Hon\.|politician|campaign|Special Projects/i);
  });

  it("is in the art lookup only with the Case 3 flag on", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_CASE3", "");
    expect((await import("@/data/art")).caseArt(3)).toBeNull();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_CASE3", "1");
    const on = await import("@/data/art");
    expect(on.caseArt(3)?.portraits).toEqual(case3Art.portraits);
    vi.unstubAllEnvs();
    vi.resetModules();
    expect(readFileSync(join(repo, "src/data/art.ts"), "utf8")).toContain(
      'if (process.env.NEXT_PUBLIC_ENABLE_CASE3 === "1") artByCaseNumber[3] = case3Art;',
    );
  });
});

describe("Case 3 locked pictures (012)", () => {
  it("sets a picture on exactly the 4 final-proof clues, matched by id and Case 3", () => {
    expect(updates).toHaveLength(4);
    expect(updates.map((u) => u.id).sort()).toEqual(Object.keys(FINAL_PROOF).sort());
    for (const u of updates) expect(u.caseId).toBe(CASE3_ID);
    // The ids really are those clues in 011.
    const hidden = insertRows(sql011, "locked_clues");
    expect(hidden).toHaveLength(20);
    for (const [id, name] of Object.entries(FINAL_PROOF)) {
      const row = hidden.find((r) => uuids(r.id)[0] === id);
      expect(sqlString(row?.name), id).toBe(name);
      expect(uuids(row?.case_id)[0]).toBe(CASE3_ID);
    }
  });

  it("touches nothing else: only those 4 updates, only ids it should, inside one transaction", () => {
    const body = noComments(sql012);
    const ids = new Set(uuids(body));
    expect(ids).toEqual(new Set([...Object.keys(FINAL_PROOF), CASE3_ID]));
    const statements = body.split(";").map((s) => s.replace(/\s+/g, " ").trim().toLowerCase()).filter(Boolean);
    expect(statements[0]).toBe("begin");
    expect(statements.at(-1)).toBe("commit");
    expect(statements.slice(1, -1)).toHaveLength(4);
    for (const s of statements.slice(1, -1)) expect(s.startsWith("update public.locked_clues set icon_image_url")).toBe(true);
    expect(body).not.toMatch(/\b(insert|delete|drop|alter|truncate|grant)\b/i);
  });

  it("uses random file names that pass the table's check and exist in public/art/locked", () => {
    const names = updates.map((u) => u.image);
    expect(new Set(names).size).toBe(4);
    for (const image of names) {
      expect(image).toMatch(LOCKED_CHECK);
      expect(image).toMatch(/^\/art\/locked\/[0-9a-f]{32}\.jpg$/);
      expect(existsSync(join(repo, "public", image)), image).toBe(true);
    }
    expect(readdirSync(join(repo, "public/art/locked")).sort()).toEqual(names.map((n) => n.split("/").pop()).sort());
  });

  it("never names a locked picture in the app's code", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
    const code = walk(join(repo, "src")).map((f) => readFileSync(f, "utf8")).join("\n");
    for (const u of updates) expect(code).not.toContain(u.image.split("/").pop()!.replace(/\.jpg$/, ""));
  });
});

describe("the bundle check and Case 3 art", () => {
  let dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
    dirs = [];
  });
  // Runs the bundle check on a tiny fake build: the real supabase/ and src/data/case3/.
  function checkBundle(browserFile: string, case3Flag: boolean, serverFile?: string) {
    const dir = mkdtempSync(join(tmpdir(), "sabi-c3art-"));
    dirs.push(dir);
    cpSync(join(repo, "supabase"), join(dir, "supabase"), { recursive: true });
    for (const f of readdirSync(join(dir, "supabase/migrations"))) if (f.endsWith("_test.sql")) rmSync(join(dir, "supabase/migrations", f));
    mkdirSync(join(dir, "src/data"), { recursive: true });
    cpSync(join(repo, "src/data/case3"), join(dir, "src/data/case3"), { recursive: true });
    mkdirSync(join(dir, ".next/static/chunks"), { recursive: true });
    writeFileSync(join(dir, ".next/static/chunks/app.js"), browserFile);
    if (serverFile) {
      mkdirSync(join(dir, ".next/server/chunks"), { recursive: true });
      writeFileSync(join(dir, ".next/server/chunks/page.js.map"), serverFile);
    }
    const env: NodeJS.ProcessEnv = { ...process.env, NEXT_PUBLIC_ENABLE_CASE3: case3Flag ? "1" : "" };
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.NEXT_PUBLIC_ENABLE_TEST_CASE;
    const r = spawnSync(process.execPath, [join(repo, "scripts/check-bundle.mjs")], { cwd: dir, env, encoding: "utf8" });
    return { code: r.status, out: r.stdout + r.stderr };
  }
  const lockedName = updates[1].image.split("/").pop()!.replace(/\.jpg$/, "");

  it("reads the 4 locked picture names from 012", () => {
    const r = checkBundle("var a=1;", true);
    expect(r.out).toContain(", 4 locked images,");
    expect(r.code).toBe(0);
  });

  it("flag on: fails when a locked picture name is in a browser file, with or without its path", () => {
    for (const planted of [`"/art/locked/${lockedName}.jpg"`, `"${lockedName}"`]) {
      const r = checkBundle(`var a=${planted};`, true);
      expect(r.out).toContain(`contains locked clue image ${lockedName}`);
      expect(r.code).toBe(1);
    }
  });

  it("flag on: the public Case 3 pictures may ship", () => {
    const r = checkBundle('var s="/_next/static/media/portrait-kelvin.0a1b2c.jpg";var c="/_next/static/media/clue-raid-report.0a1b2c.jpg";', true);
    expect(r.code).toBe(0);
  });

  it("flag off: fails when a Case 3 picture is anywhere in the build, server source maps too", () => {
    const r = checkBundle("var a=1;", false, '{"sources":["../public/art/scene-lekki-duplex.jpg"]}');
    expect(r.out).toContain('.next/server/chunks/page.js.map: contains Case 3 "scene-lekki-duplex"');
    expect(r.code).toBe(1);
    const browser = checkBundle('var p="/_next/static/media/portrait-bisola.0a1b2c.jpg";', false);
    expect(browser.out).toContain('contains Case 3 "portrait-bisola"');
    expect(browser.code).toBe(1);
  });
});
