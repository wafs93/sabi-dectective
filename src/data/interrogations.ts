// Interrogation dialogue lives here until it moves into the database.
// Keyed by suspect name (must match suspects.name in Supabase).
// unlockedByClue must match a clues.name exactly.

export type InterrogationQuestion = {
  id: string;
  text: string;
  defaultAnswer: string;
  unlockedByClue?: string;
  confrontText?: string;
  confrontedAnswer?: string;
};

export type Interrogation = {
  openingLine: string;
  questions: InterrogationQuestion[];
};

export const interrogations: Record<string, Interrogation> = {
  Chuks: {
    openingLine: "Ah, Detective, I would never touch Mama. She's like my own mother.",
    questions: [
      {
        id: "chuks-paid",
        text: "Were you paid last month?",
        defaultAnswer: "Things have been slow for her, that's all. I understand.",
        unlockedByClue: "Torn wage ledger page",
        confrontText: "This ledger says you're owed two months' pay. That's not nothing.",
        confrontedAnswer:
          "Okay, fine, I was vexed. But vexed is not the same as attacking somebody.",
      },
      {
        id: "chuks-where",
        text: "Where were you last night?",
        defaultAnswer: "Home, sleeping, like everybody else.",
        unlockedByClue: "Muddy footprint",
        confrontText: "The footprints by the back alley match your boots exactly.",
        confrontedAnswer:
          "Alright, I came back to talk to her about the money. Just talk. She wouldn't listen, and... things got out of hand.",
      },
    ],
  },
  "Alhaja Bisi": {
    openingLine: "Me? Mama and I compete, yes, but I would never hurt her.",
    questions: [
      {
        id: "bisi-where",
        text: "Where were you last night?",
        defaultAnswer: "I closed up and went home early.",
        unlockedByClue: "Market security log",
        confrontText: "The gate log shows you left at 7pm.",
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
