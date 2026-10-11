import { CASE2_CLUES, CASE2_ID, CASE2_SUSPECTS } from "@/data/case2-ids";
import type { CaseBundle } from "@/lib/types";

// Mirrors the public parts of supabase/migrations/005_case2.sql so the story can be read offline.
// It must never hold the answer: no solution, key evidence, red herring flags or result texts.

export const case2Fallback: CaseBundle = {
  caseData: {
    id: CASE2_ID,
    case_number: 2,
    title: "The Second Buyer",
    briefing_text:
      "Mama Nkechi's family land at Ajah is due to be sold to a developer tomorrow morning. Tonight the original Certificate of Occupancy vanished from the family safe. Find out who took it, and why.",
    scene_image_url: null,
    release_date: null,
  },
  suspects: [
    {
      id: CASE2_SUSPECTS.dele,
      case_id: CASE2_ID,
      name: "Uncle Dele",
      portrait_image_url: null,
      connection: "Mama Nkechi's brother-in-law. Deep in debt and loud about the sale.",
      motive: "Says the family is being cheated, and was at the house tonight.",
    },
    {
      id: CASE2_SUSPECTS.kunle,
      case_id: CASE2_ID,
      name: "Barrister Kunle",
      portrait_image_url: null,
      connection: "Barrister Adekunle Balogun, the family lawyer. Calm and helpful.",
      motive: "Drew up the sale papers. Says he was in Abuja that night.",
    },
    {
      id: CASE2_SUSPECTS.ada,
      case_id: CASE2_ID,
      name: "Ada",
      portrait_image_url: null,
      connection: "Mama Nkechi's housekeeper for eleven years.",
      motive: "Knows the safe code, and is clearly hiding something.",
    },
    {
      id: CASE2_SUSPECTS.musa,
      case_id: CASE2_ID,
      name: "Alhaji Musa",
      portrait_image_url: null,
      connection: "Agent for the developer buying the land.",
      motive: "Pushing hard for the sale to go through tomorrow.",
    },
  ],
  clues: [
    {
      id: CASE2_CLUES.tollReceipt,
      case_id: CASE2_ID,
      name: "Toll receipt, 01:48",
      icon_image_url: null,
      found_description:
        "Found on the back seat of Barrister Kunle's car, parked outside the house. A Lekki toll gate receipt stamped 01:48 last night. It puts him in Lagos, not Abuja.",
    },
    {
      id: CASE2_CLUES.secondAgreement,
      case_id: CASE2_ID,
      name: "Second sale agreement",
      icon_image_url: null,
      found_description:
        "Found folded under the blotter on the study desk. A sale agreement for Plot 14. First Buyer: Greenfield Homes Ltd. Second Buyer: Chief R. Ibe. Seller: Mrs N. Okafor. Witnessed by A. O. Balogun.",
    },
    {
      id: CASE2_CLUES.keyLog,
      case_id: CASE2_ID,
      name: "Safe key log",
      icon_image_url: null,
      found_description:
        "Found open on the study desk beside the empty safe. It lists two keys: \"Family key - Mama Nkechi\" and \"Lawyer's key - A.O.B.\"",
    },
    {
      id: CASE2_CLUES.debtLetter,
      case_id: CASE2_ID,
      name: "Uncle Dele's final notice",
      icon_image_url: null,
      found_description:
        "Found in a pile of unopened envelopes on the study side table. A FINAL NOTICE addressed to Uncle Dele: N2,450,000 owed.",
    },
    {
      id: CASE2_CLUES.tornNote,
      case_id: CASE2_ID,
      name: "Ada's torn note",
      icon_image_url: null,
      found_description:
        "Found on the kitchen table beside the suya spice jar, in Ada's handwriting: \"...the back gate... by midnight... don't let him see... HURRY!\"",
    },
  ],
};
