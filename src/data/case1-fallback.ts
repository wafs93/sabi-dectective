import type { CaseBundle } from "@/lib/types";

// Mirrors supabase/seed.sql so the game is playable before Supabase is configured.
const CASE_ID = "11111111-1111-4111-8111-000000000001";
const CHUKS_ID = "22222222-2222-4222-8222-000000000001";
const BISI_ID = "22222222-2222-4222-8222-000000000002";

export const case1Fallback: CaseBundle = {
  caseData: {
    id: CASE_ID,
    case_number: 1,
    title: "The Empty Stall",
    briefing_text:
      "Welcome, Detective. Your first case. Mama Chidinma, a well-known trader at Ladipo Market, was found knocked unconscious in her stall early this morning. Her cash box was missing. She's alive, recovering in hospital, and awake enough to say only one thing: she argued with someone about money the night before it happened. Two people in the market had reason to want her cash box gone. Question them both, follow the clues, and work out who really did it.",
    scene_image_url: null,
    release_date: null,
    solution_suspect_id: CHUKS_ID,
  },
  suspects: [
    {
      id: CHUKS_ID,
      case_id: CASE_ID,
      name: "Chuks",
      portrait_image_url: null,
      connection: "Stall boy who worked for Mama Chidinma, owed back pay for two months.",
      motive: "Angry about unpaid wages, heard arguing with her the evening before.",
    },
    {
      id: BISI_ID,
      case_id: CASE_ID,
      name: "Alhaja Bisi",
      portrait_image_url: null,
      connection: "Rival trader in the stall next door.",
      motive: "Long-running rivalry over customers, but no history of violence.",
    },
  ],
  clues: [
    {
      id: "33333333-3333-4333-8333-000000000001",
      case_id: CASE_ID,
      name: "Torn wage ledger page",
      icon_image_url: null,
      found_description:
        "Found on the stall floor under an overturned basket. Shows Chuks was owed back pay, confirming the argument was about money.",
      is_red_herring: false,
    },
    {
      id: "33333333-3333-4333-8333-000000000002",
      case_id: CASE_ID,
      name: "Market security log",
      icon_image_url: null,
      found_description:
        "From the gate guard's notebook. Logs Alhaja Bisi leaving the market at 7pm, a full hour before the attack.",
      is_red_herring: false,
    },
    {
      id: "33333333-3333-4333-8333-000000000003",
      case_id: CASE_ID,
      name: "Muddy footprint",
      icon_image_url: null,
      found_description:
        "Leads from the stall to the back alley. Matches the work boots Chuks wears, not Alhaja Bisi's sandals.",
      is_red_herring: false,
    },
  ],
};
