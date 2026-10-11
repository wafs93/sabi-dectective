import type { CaseArt } from "@/data/art";
import { CASE2_CLUES, CASE2_SUSPECTS } from "@/data/case2-ids";
import clueDebtLetter from "../../public/art/clue-debt-letter.jpg";
import clueKeyLog from "../../public/art/clue-key-log.jpg";
import clueSecondAgreement from "../../public/art/clue-second-agreement.jpg";
import clueTollReceipt from "../../public/art/clue-toll-receipt.jpg";
import clueTornNote from "../../public/art/clue-torn-note.jpg";
import portraitAda from "../../public/art/portrait-ada.jpg";
import portraitAlhajiMusa from "../../public/art/portrait-alhaji-musa.jpg";
import portraitBarristerKunle from "../../public/art/portrait-barrister-kunle.jpg";
import portraitUncleDele from "../../public/art/portrait-uncle-dele.jpg";
import sceneFamilyStudy from "../../public/art/scene-family-study.jpg";

// Case 2 art. Types and the lookup by case number live in art.ts.

export const case2Art: CaseArt = {
  intro:
    "The family land at Ajah sells tomorrow, and tonight the title deed vanished from the safe. Find out who took it.",
  scene: sceneFamilyStudy,
  sceneAlt:
    "Mama Nkechi's study at night: rain on the window and a car parked outside, a brass lamp lit over a small desk of papers, and a wall safe hanging open and empty.",
  // The desk lamp's bulb.
  glow: { x: 51.5, y: 47.5 },
  // Positions set by eye from the 768x1152 scene image.
  hotspots: [
    {
      clueId: CASE2_CLUES.tollReceipt,
      x: 22.5,
      y: 45,
      size: 13,
      label: "the car parked outside the window",
    },
    {
      clueId: CASE2_CLUES.keyLog,
      x: 84,
      y: 43,
      size: 13,
      label: "the open safe",
    },
    {
      clueId: CASE2_CLUES.debtLetter,
      x: 38.5,
      y: 60.5,
      size: 12,
      label: "the papers by the lamp",
    },
    {
      clueId: CASE2_CLUES.secondAgreement,
      x: 55,
      y: 64.5,
      size: 12,
      label: "the document on the desk",
    },
    {
      clueId: CASE2_CLUES.tornNote,
      x: 69,
      y: 68,
      size: 12,
      label: "the crumpled paper on the desk edge",
    },
  ],
  portraits: {
    [CASE2_SUSPECTS.dele]: portraitUncleDele,
    [CASE2_SUSPECTS.kunle]: portraitBarristerKunle,
    [CASE2_SUSPECTS.ada]: portraitAda,
    [CASE2_SUSPECTS.musa]: portraitAlhajiMusa,
  },
  clues: {
    [CASE2_CLUES.tollReceipt]: clueTollReceipt,
    [CASE2_CLUES.secondAgreement]: clueSecondAgreement,
    [CASE2_CLUES.keyLog]: clueKeyLog,
    [CASE2_CLUES.debtLetter]: clueDebtLetter,
    [CASE2_CLUES.tornNote]: clueTornNote,
  },
};
