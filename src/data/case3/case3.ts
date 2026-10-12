import type { CaseBundle } from "@/lib/types";

// Case 3 "The Clean Money": the public story only (case, 8 suspects, 8 visible clues).
// Mirrors supabase/migrations/010_case3.sql. No answer, and nothing about the 20 hidden clues:
// their names, text, ids and rules live only in the private tables (011).
// Registered only in builds with NEXT_PUBLIC_ENABLE_CASE3=1 (see src/data/cases.ts). With the flag
// off nothing imports what this exports, and the build drops it. No runtime imports, on purpose.

export const CASE3_ID = "11111111-1111-4111-8111-000000000003";

export const CASE3_SUSPECTS = {
  kelvin: "22222222-2222-4222-8222-000000000301",
  madu: "22222222-2222-4222-8222-000000000302",
  sanni: "22222222-2222-4222-8222-000000000303",
  bisola: "22222222-2222-4222-8222-000000000304",
  yinka: "22222222-2222-4222-8222-000000000305",
  aisha: "22222222-2222-4222-8222-000000000306",
  segun: "22222222-2222-4222-8222-000000000307",
  chidi: "22222222-2222-4222-8222-000000000308",
} as const;

// V1 to V8: the visible clues, found in the scene.
export const CASE3_CLUES = {
  V1: "33333333-3333-4333-8333-000000000301",
  V2: "33333333-3333-4333-8333-000000000302",
  V3: "33333333-3333-4333-8333-000000000303",
  V4: "33333333-3333-4333-8333-000000000304",
  V5: "33333333-3333-4333-8333-000000000305",
  V6: "33333333-3333-4333-8333-000000000306",
  V7: "33333333-3333-4333-8333-000000000307",
  V8: "33333333-3333-4333-8333-000000000308",
} as const;

export const case3Fallback: CaseBundle = {
  caseData: {
    id: CASE3_ID,
    case_number: 3,
    title: "The Clean Money",
    briefing_text:
      "Three months, forty bank accounts and N186,000,000 nobody can explain. On 3 October police raided a flat in Lekki and arrested a young yahoo boy whose accounts were full of round deposits. The tip came from a prepaid SIM the evening before. Follow the money and find out who it really belonged to.",
    scene_image_url: null,
    release_date: null,
  },
  suspects: [
    {
      id: CASE3_SUSPECTS.kelvin,
      case_id: CASE3_ID,
      name: "Kelvin \"KP\" Okoro",
      portrait_image_url: null,
      connection: "A 24-year-old yahoo boy, arrested in the Lekki raid on 3 October. The accounts are in his name.",
      motive: "Runs romance scams online and lives far above his means.",
    },
    {
      id: CASE3_SUSPECTS.madu,
      case_id: CASE3_ID,
      name: "Hon. Ifeanyi Madu",
      portrait_image_url: null,
      connection: "Governorship candidate. Says his campaign account was hacked.",
      motive: "Needs a spotless campaign, and a lot of money, before the election.",
    },
    {
      id: CASE3_SUSPECTS.sanni,
      case_id: CASE3_ID,
      name: "Dr. Sanni Bello",
      portrait_image_url: null,
      connection: "Accountant to the Madu campaign. Calm and helpful.",
      motive: "Keeps the campaign books and knows where every naira goes.",
    },
    {
      id: CASE3_SUSPECTS.bisola,
      case_id: CASE3_ID,
      name: "Mrs. Bisola Madu",
      portrait_image_url: null,
      connection: "Runs the Hope Bridge Foundation. Signs whatever she is given.",
      motive: "Her foundation took in large donations she can't fully explain.",
    },
    {
      id: CASE3_SUSPECTS.yinka,
      case_id: CASE3_ID,
      name: "Mr. Yinka Adewale",
      portrait_image_url: null,
      connection: "Runs a bureau de change near the bank. Very nervous.",
      motive: "Changed big sums of naira into dollars with very little paperwork.",
    },
    {
      id: CASE3_SUSPECTS.aisha,
      case_id: CASE3_ID,
      name: "Aisha Lawal",
      portrait_image_url: null,
      connection: "Compliance officer at the bank. She flagged the accounts, then went quiet.",
      motive: "Her flag was closed two days after she raised it, and she won't say why.",
    },
    {
      id: CASE3_SUSPECTS.segun,
      case_id: CASE3_ID,
      name: "Segun Alabi",
      portrait_image_url: null,
      connection: "Campaign manager for the Madu campaign.",
      motive: "Deleted files from the campaign office after the raid.",
    },
    {
      id: CASE3_SUSPECTS.chidi,
      case_id: CASE3_ID,
      name: "Oga Chidi Eze",
      portrait_image_url: null,
      connection: "Runs a separate fraud ring that banks at the same bank.",
      motive: "Moves stolen money through accounts that look a lot like Kelvin's.",
    },
  ],
  clues: [
    {
      id: CASE3_CLUES.V1,
      case_id: CASE3_ID,
      name: "Fake dating profiles",
      icon_image_url: null,
      found_description: "Found on Kelvin's laptop from the raid. Dozens of fake profiles used to sweet-talk lonely foreigners out of small sums.",
    },
    {
      id: CASE3_CLUES.V2,
      case_id: CASE3_ID,
      name: "Kelvin's phone chat",
      icon_image_url: null,
      found_description: "Seized in the raid. Kelvin chats with a contact saved as \"Oga C\" about which accounts are \"hot\" this week.",
    },
    {
      id: CASE3_CLUES.V3,
      case_id: CASE3_ID,
      name: "Hope Bridge donation list",
      icon_image_url: null,
      found_description: "From the Hope Bridge Foundation office. Three donations of N58,900,000 each, received on 30 July, 30 August and 30 September.",
    },
    {
      id: CASE3_CLUES.V4,
      case_id: CASE3_ID,
      name: "Kelvin's bank statement",
      icon_image_url: null,
      found_description: "From the bank. Round credits of N62,000,000 landed on 28 July, 28 August and 28 September, N186,000,000 in total.",
    },
    {
      id: CASE3_CLUES.V5,
      case_id: CASE3_ID,
      name: "Yinka's receipt book",
      icon_image_url: null,
      found_description: "Taken from the bureau de change counter. The pages for the end of July, August and September have been torn out.",
    },
    {
      id: CASE3_CLUES.V6,
      case_id: CASE3_ID,
      name: "Compliance flag memo",
      icon_image_url: null,
      found_description: "From the bank. Aisha Lawal flagged 40 linked accounts on 12 September. A note at the bottom says the flag was closed on 14 September.",
    },
    {
      id: CASE3_CLUES.V7,
      case_id: CASE3_ID,
      name: "Campaign finance filing",
      icon_image_url: null,
      found_description: "The campaign's public filing. It declares N186,000,000 in \"donor contributions\" but names no donors.",
    },
    {
      id: CASE3_CLUES.V8,
      case_id: CASE3_ID,
      name: "Raid report",
      icon_image_url: null,
      found_description: "Police report on the Lekki raid of 3 October. The tip-off came from a prepaid SIM on the evening of 2 October.",
    },
  ],
};
