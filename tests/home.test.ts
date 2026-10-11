import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home, { type HomeCase } from "@/components/Home";

const card = (caseNumber: number, playable: boolean, extra: Partial<HomeCase> = {}): HomeCase => ({
  caseNumber,
  title: playable ? `Title ${caseNumber}` : null,
  art: null,
  playable,
  status: "new",
  hasSavedResult: false,
  ...extra,
});

const render = (cases: HomeCase[], todayCaseNumber: number) =>
  renderToStaticMarkup(
    createElement(Home, {
      cases,
      todayCaseNumber,
      rank: "Rookie",
      solved: 0,
      best: null,
      usingLocalData: false,
      onOpenCase: () => {},
    }),
  );

const lockedLabel = (n: number) => `aria-label="Case ${n}, locked, coming soon"`;

describe("Home case cards", () => {
  it("shows Case 1 as today's case and Cases 2 and 3 as locked", () => {
    const html = render([card(1, true), card(2, false), card(3, false)], 1);
    expect(html).toContain("Today&#x27;s case");
    expect(html).toContain("Case 1");
    expect(html).toContain("Title 1");
    expect(html).toContain("Investigate the case");
    expect(html).toContain(lockedLabel(2));
    expect(html).toContain(lockedLabel(3));
    expect(html.match(/Coming soon/g)).toHaveLength(2);
    // Only the today's case button: locked cards can't be opened.
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it("shows a playable Case 2 as a card that opens, and keeps Case 3 locked", () => {
    const html = render(
      [card(1, true, { status: "cracked", hasSavedResult: true }), card(2, true), card(3, false)],
      2,
    );
    expect(html).toContain("Title 2");
    expect(html).not.toContain(lockedLabel(2));
    expect(html).toContain(lockedLabel(3));
    expect(html.match(/Coming soon/g)).toHaveLength(1);
    // Today's case (Case 2) plus an open card for Case 1, which shows its verdict.
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain("Title 1");
    expect(html).toContain("Cracked");
  });

  it("never offers a locked case as today's case", () => {
    const html = render([card(1, true), card(2, false)], 2);
    expect(html).not.toContain("Today&#x27;s case");
    expect(html).toContain(lockedLabel(2));
  });
});
