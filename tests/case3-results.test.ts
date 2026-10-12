import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CASE3_ID, case3Fallback } from "@/data/case3/case3";
import { insertRows, sqlString } from "./helpers/sql";

// Case 3's result texts live only in private data (case_solutions), written by the migrations.
// They are not in the offline copy (src/data/case3/), so they are read from the SQL here: the
// insert in 011, then any later update, in file order. The last one is what Supabase holds once
// every migration has been run.
const dir = join(process.cwd(), "supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

type Texts = Record<"missed_text" | "close_text" | "cracked_text", string>;
const history: { file: string; column: keyof Texts; text: string }[] = [];
for (const file of files) {
  const sql = readFileSync(join(dir, file), "utf8");
  for (const row of insertRows(sql, "case_solutions")) {
    if (!row.case_id?.includes(CASE3_ID)) continue;
    for (const column of ["missed_text", "close_text", "cracked_text"] as const) {
      history.push({ file, column, text: sqlString(row[column])! });
    }
  }
  const noComments = sql.replace(/--.*$/gm, "");
  for (const m of noComments.matchAll(
    /update\s+public\.case_solutions\s+set\s+(missed_text|close_text|cracked_text)\s*=\s*'((?:[^']|'')*)'\s+where\s+case_id\s*=\s*'([^']+)'/gi,
  )) {
    if (m[3] === CASE3_ID) history.push({ file, column: m[1].toLowerCase() as keyof Texts, text: m[2].replaceAll("''", "'") });
  }
}
const latest = (column: keyof Texts) => history.filter((h) => h.column === column).at(-1)!;

// Every suspect by full name and the short forms a line might use.
const NAMES = [
  ...case3Fallback.suspects.map((s) => s.name),
  "Kelvin", "KP", "Okoro", "Ifeanyi", "Madu", "Honourable", "Hon.", "Sanni", "Bello", "Bisola", "Yinka", "Adewale",
  "Aisha", "Lawal", "Segun", "Alabi", "Chidi", "Eze", "Oga C",
];
// Words that would describe who the culprit is without naming them.
const DESCRIBES = ["campaign", "candidate", "governor", "politician", "accountant", "foundation", "wife", "husband", "yahoo boy", "compliance", "bureau"];
const word = (w: string) => new RegExp(`(^|[^A-Za-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i");

describe("Case 3 result texts", () => {
  it("are all readable from the migrations", () => {
    expect(history.filter((h) => h.file.startsWith("011"))).toHaveLength(3);
    expect(latest("missed_text").file).toBe("013_case3_sanni_missed.sql");
  });

  // Missed It is the only text a wrong accusation ever shows (see src/engine/scoring.ts):
  // Close Call and Case Cracked need the right suspect.
  it("Missed It names no suspect but {accused}, and does not describe the culprit", () => {
    const { text } = latest("missed_text");
    expect(text.startsWith("{accused} ")).toBe(true);
    const rest = text.replaceAll("{accused}", "");
    for (const name of NAMES) expect(rest, name).not.toMatch(word(name));
    for (const w of DESCRIBES) expect(rest, w).not.toMatch(word(w));
  });

  it("Missed It is the new wording, which is true for every wrong suspect", () => {
    expect(latest("missed_text").text).toBe(
      "{accused} wasn't the one giving the orders, and the case fell apart in court. While you chased the wrong person, the real money trail went quiet, and whoever was behind it walked away untouched.",
    );
  });

  it("the old 011 Missed It text named the culprit (so 013 must be run to fix the live game)", () => {
    const old = history.find((h) => h.file.startsWith("011") && h.column === "missed_text")!.text;
    expect(old).toMatch(word("Madu"));
  });
});
