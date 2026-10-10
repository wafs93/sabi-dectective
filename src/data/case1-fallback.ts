import { CASE1_CLUES, CASE1_ID, CASE1_SUSPECTS } from "@/data/case1-ids";
import type { CaseBundle } from "@/lib/types";

// Mirrors the public parts of supabase/seed.sql so the story can be read offline.
// It must never hold the answer: no solution, key evidence, red herring flags or result texts.

export const case1Fallback: CaseBundle = {
  caseData: {
    id: CASE1_ID,
    case_number: 1,
    title: "The Empty Stall",
    briefing_text:
      "Welcome, Detective. Your first case. Mama Chidinma, a well-known trader at Ladipo Market, was found knocked unconscious in her stall early this morning. Her cash box was missing. She's alive, recovering in hospital, and awake enough to say only one thing: she argued with someone about money the night before it happened. Two people in the market had reason to want her cash box gone. Question them both, follow the clues, and work out who really did it.",
    scene_image_url: null,
    release_date: null,
  },
  suspects: [
    {
      id: CASE1_SUSPECTS.chuks,
      case_id: CASE1_ID,
      name: "Chuks",
      portrait_image_url: null,
      connection: "Stall boy who worked for Mama Chidinma, owed back pay for two months.",
      motive: "Angry about unpaid wages, heard arguing with her the evening before.",
    },
    {
      id: CASE1_SUSPECTS.bisi,
      case_id: CASE1_ID,
      name: "Alhaja Bisi",
      portrait_image_url: null,
      connection: "Rival trader in the stall next door.",
      motive: "Long-running rivalry over customers, but no history of violence.",
    },
  ],
  clues: [
    {
      id: CASE1_CLUES.ledger,
      case_id: CASE1_ID,
      name: "Torn wage ledger page",
      icon_image_url: null,
      found_description:
        "Found on the stall floor under an overturned basket. Shows Chuks was owed back pay, confirming the argument was about money.",
    },
    {
      id: CASE1_CLUES.securityLog,
      case_id: CASE1_ID,
      name: "Market security log",
      icon_image_url: null,
      found_description:
        "From the gate guard's notebook. Logs Alhaja Bisi leaving the market at 7pm, a full hour before the attack.",
    },
    {
      id: CASE1_CLUES.footprint,
      case_id: CASE1_ID,
      name: "Muddy footprint",
      icon_image_url: null,
      found_description:
        "Leads from the stall to the back alley. Matches the work boots Chuks wears, not Alhaja Bisi's sandals.",
    },
  ],
};
