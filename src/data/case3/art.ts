import type { CaseArt } from "@/data/art";
import clueBankStatement from "../../../public/art/clue-bank-statement.jpg";
import clueCampaignFiling from "../../../public/art/clue-campaign-filing.jpg";
import clueDatingProfiles from "../../../public/art/clue-dating-profiles.jpg";
import clueDonationList from "../../../public/art/clue-donation-list.jpg";
import clueFlagMemo from "../../../public/art/clue-flag-memo.jpg";
import cluePhoneChat from "../../../public/art/clue-phone-chat.jpg";
import clueRaidReport from "../../../public/art/clue-raid-report.jpg";
import clueReceiptBook from "../../../public/art/clue-receipt-book.jpg";
import portraitAisha from "../../../public/art/portrait-aisha.jpg";
import portraitBisola from "../../../public/art/portrait-bisola.jpg";
import portraitChidi from "../../../public/art/portrait-chidi.jpg";
import portraitKelvin from "../../../public/art/portrait-kelvin.jpg";
import portraitMadu from "../../../public/art/portrait-madu.jpg";
import portraitSanni from "../../../public/art/portrait-sanni.jpg";
import portraitSegun from "../../../public/art/portrait-segun.jpg";
import portraitYinka from "../../../public/art/portrait-yinka.jpg";
import sceneLekkiDuplex from "../../../public/art/scene-lekki-duplex.jpg";

// Case 3 art: the scene, 8 portraits and the 8 visible clues. Types and the lookup by case
// number live in art.ts, which registers this.
// The 4 final-proof pictures are not here: they reach the browser only through an unlock reply.
// Ids are written out (not imported from case3.ts) so this file stays self-contained.

export const case3Art: CaseArt = {
  intro:
    "Police raided a Lekki duplex and found a romance-scam ring sitting on N186,000,000 nobody can explain. Follow the money to whoever it really belongs to.",
  scene: sceneLekkiDuplex,
  sceneAlt:
    "The raided Lekki duplex at night: an overturned chair by the window, and a brass lamp lit over a long table with a laptop, two phones, a receipt book, a leather folder and stacks of papers.",
  // The desk lamp's shade.
  glow: { x: 44.5, y: 35.5 },
  // Positions set by eye from the 768x1152 scene image.
  hotspots: [
    {
      clueId: "33333333-3333-4333-8333-000000000301",
      x: 26.5,
      y: 48,
      size: 12,
      label: "the open laptop",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000302",
      x: 32,
      y: 64,
      size: 11,
      label: "the phone on the table",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000303",
      x: 54.5,
      y: 57,
      size: 12,
      label: "the bundle of papers tied with string",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000304",
      x: 7.5,
      y: 52,
      size: 11,
      label: "the loose sheet by the laptop",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000305",
      x: 52,
      y: 73,
      size: 12,
      label: "the open receipt book",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000306",
      x: 59,
      y: 88,
      size: 11,
      label: "the sheet under the report",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000307",
      x: 75,
      y: 64.5,
      size: 12,
      label: "the leather folder",
    },
    {
      clueId: "33333333-3333-4333-8333-000000000308",
      x: 73,
      y: 79.5,
      size: 12,
      label: "the printed report",
    },
  ],
  portraits: {
    "22222222-2222-4222-8222-000000000301": portraitKelvin,
    "22222222-2222-4222-8222-000000000302": portraitMadu,
    "22222222-2222-4222-8222-000000000303": portraitSanni,
    "22222222-2222-4222-8222-000000000304": portraitBisola,
    "22222222-2222-4222-8222-000000000305": portraitYinka,
    "22222222-2222-4222-8222-000000000306": portraitAisha,
    "22222222-2222-4222-8222-000000000307": portraitSegun,
    "22222222-2222-4222-8222-000000000308": portraitChidi,
  },
  clues: {
    "33333333-3333-4333-8333-000000000301": clueDatingProfiles,
    "33333333-3333-4333-8333-000000000302": cluePhoneChat,
    "33333333-3333-4333-8333-000000000303": clueDonationList,
    "33333333-3333-4333-8333-000000000304": clueBankStatement,
    "33333333-3333-4333-8333-000000000305": clueReceiptBook,
    "33333333-3333-4333-8333-000000000306": clueFlagMemo,
    "33333333-3333-4333-8333-000000000307": clueCampaignFiling,
    "33333333-3333-4333-8333-000000000308": clueRaidReport,
  },
};
