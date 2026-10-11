import type { CaseArt } from "@/data/art";
import { CASE1_CLUES, CASE1_SUSPECTS } from "@/data/case1-ids";
import clueMuddyFootprint from "../../public/art/clue-muddy-footprint.jpg";
import clueSecurityLog from "../../public/art/clue-security-log.jpg";
import clueWageLedger from "../../public/art/clue-wage-ledger.jpg";
import portraitBisi from "../../public/art/portrait-alhaja-bisi.jpg";
import portraitChuks from "../../public/art/portrait-chuks.jpg";
import sceneEmptyStall from "../../public/art/scene-empty-stall.jpg";

// Case 1 art. Types and the lookup by case number live in art.ts.

export const case1Art: CaseArt = {
  intro: "Mama Chidinma was attacked in her Ladipo Market stall and her cash box is gone. Find out who did it.",
  scene: sceneEmptyStall,
  sceneAlt:
    "Mama Chidinma's stall at night: a lantern over the counter, an overturned basket, and muddy boot prints leading out through an open back door.",
  // Positions set by eye from the 768x1152 scene image.
  hotspots: [
    {
      clueId: CASE1_CLUES.securityLog,
      x: 12,
      y: 32.5,
      size: 19,
      label: "the notebook on the counter",
    },
    {
      clueId: CASE1_CLUES.footprint,
      x: 77,
      y: 49,
      size: 19,
      label: "the prints by the back door",
    },
    {
      clueId: CASE1_CLUES.ledger,
      x: 43,
      y: 88,
      size: 19,
      label: "the paper by the basket",
    },
  ],
  portraits: {
    [CASE1_SUSPECTS.chuks]: portraitChuks,
    [CASE1_SUSPECTS.bisi]: portraitBisi,
  },
  clues: {
    [CASE1_CLUES.securityLog]: clueSecurityLog,
    [CASE1_CLUES.footprint]: clueMuddyFootprint,
    [CASE1_CLUES.ledger]: clueWageLedger,
  },
};
