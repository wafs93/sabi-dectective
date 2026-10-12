// A small SQL reader for tests: enough for the plain inserts in our migrations and seeds.
// The same approach as scripts/check-bundle.mjs. Tests only.

// Quotes toggle string mode; an escaped '' toggles twice, so it stays inside the string.
function stripComments(sql: string): string {
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

function readList(sql: string, open: number): { parts: string[]; end: number } {
  const parts: string[] = [];
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
export function insertRows(raw: string, table: string): Record<string, string>[] {
  const sql = stripComments(raw);
  const rows: Record<string, string>[] = [];
  for (const m of sql.matchAll(new RegExp(`insert\\s+into\\s+(?:public\\.)?${table}\\s*\\(`, "gi"))) {
    const cols = readList(sql, m.index! + m[0].length - 1);
    let i = cols.end + 1;
    const at = sql.slice(i).search(/\S/);
    if (!/^values\b/i.test(sql.slice(i + at))) continue;
    i += at + "values".length;
    for (;;) {
      while (/\s/.test(sql[i])) i++;
      if (sql[i] !== "(") break;
      const values = readList(sql, i);
      rows.push(Object.fromEntries(cols.parts.map((c, k) => [c.toLowerCase(), values.parts[k] ?? ""])));
      i = values.end + 1;
      while (/\s/.test(sql[i])) i++;
      if (sql[i] !== ",") break;
      i++;
    }
  }
  return rows;
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export const uuids = (s: string | undefined): string[] => (s ?? "").toLowerCase().match(UUID) ?? [];
export const sqlString = (v: string | undefined): string | null =>
  /^'([\s\S]*)'$/.exec(v ?? "")?.[1].replaceAll("''", "'") ?? null;

// Every run of `n` words in a text (the whole text if shorter), split around {accused}.
export function wordRuns(text: string, n = 8): string[] {
  return text.split("{accused}").flatMap((part) => {
    const words = part.trim().split(/\s+/).filter(Boolean);
    if (words.length <= n) return words.length ? [words.join(" ")] : [];
    return words.slice(0, words.length - n + 1).map((_, i) => words.slice(i, i + n).join(" "));
  });
}
