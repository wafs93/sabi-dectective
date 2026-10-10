import { CASE1_CLUES, CASE1_SUSPECTS } from "@/data/case1-ids";

// Interrogation dialogue lives here until it moves into the database.
// Keyed by suspect id; unlockedByClueId is a clue id.

export type InterrogationQuestion = {
  id: string;
  text: string;
  defaultAnswer: string;
  unlockedByClueId?: string;
  confrontText?: string;
  confrontedAnswer?: string;
};

export type Interrogation = {
  openingLine: string;
  questions: InterrogationQuestion[];
};

export const interrogations: Record<string, Interrogation> = {
  [CASE1_SUSPECTS.chuks]: {
    openingLine: "Ah, Detective, I would never touch Mama. She's like my own mother.",
    questions: [
      {
        id: "chuks-paid",
        text: "Were you paid last month?",
        defaultAnswer: "Things have been slow for her, that's all. I understand.",
        unlockedByClueId: CASE1_CLUES.ledger,
        confrontText: "This ledger says you're owed two months' pay. That's not nothing.",
        confrontedAnswer:
          "Okay, fine, I was vexed. But vexed is not the same as attacking somebody.",
      },
      {
        id: "chuks-where",
        text: "Where were you last night?",
        defaultAnswer: "Home, sleeping, like everybody else.",
        unlockedByClueId: CASE1_CLUES.footprint,
        confrontText: "The footprints by the back alley match your boots exactly.",
        confrontedAnswer:
          "Alright, I came back to talk to her about the money. Just talk. She wouldn't listen, and... things got out of hand.",
      },
    ],
  },
  [CASE1_SUSPECTS.bisi]: {
    openingLine: "Me? Mama and I compete, yes, but I would never hurt her.",
    questions: [
      {
        id: "bisi-where",
        text: "Where were you last night?",
        defaultAnswer: "I closed up and went home early.",
        unlockedByClueId: CASE1_CLUES.securityLog,
        confrontText: "Mama Chidinma's logbook shows you left at 7pm.",
        confrontedAnswer: "Exactly. I was long gone before anything happened.",
      },
      {
        id: "bisi-resent",
        text: "Do you resent Mama Chidinma?",
        defaultAnswer: "We fight over customers, that's business. Nothing more.",
      },
    ],
  },
};
