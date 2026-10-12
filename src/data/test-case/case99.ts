import type { Interrogation } from "@/data/interrogations";
import type { CaseBundle } from "@/lib/types";

// Case 99 "Test Locker": a fake case for testing locked clues on Vercel Preview only.
// Registered only when NEXT_PUBLIC_ENABLE_TEST_CASE=1 at build time (see src/data/cases.ts
// and src/data/interrogations.ts); with the flag off, nothing imports what this exports and
// the build drops it. Public story only: no answer, no locked clue ids, names, text or rules.
// It is a copy of the Case 99 test fixture's public parts; a test keeps the two identical.

export const CASE99_ID = "11111111-1111-4111-8111-000000000099";

export const CASE99_SUSPECTS = {
  alpha: "22222222-2222-4222-8222-000000009901",
  beta: "22222222-2222-4222-8222-000000009902",
} as const;

export const CASE99_CLUES = {
  redSock: "33333333-3333-4333-8333-000000009901",
  blueSock: "33333333-3333-4333-8333-000000009902",
  rubberDuck: "33333333-3333-4333-8333-000000009903",
} as const;

export const case99Fallback: CaseBundle = {
  caseData: {
    id: CASE99_ID,
    case_number: 99,
    title: "Test Locker",
    briefing_text: "TEST ONLY. Fake briefing: a pretend locker was opened by a pretend person.",
    scene_image_url: null,
    release_date: null,
  },
  suspects: [
    {
      id: CASE99_SUSPECTS.alpha,
      case_id: CASE99_ID,
      name: "Test Suspect Alpha",
      portrait_image_url: null,
      connection: "TEST ONLY. Fake connection.",
      motive: "TEST ONLY. Fake motive.",
    },
    {
      id: CASE99_SUSPECTS.beta,
      case_id: CASE99_ID,
      name: "Test Suspect Beta",
      portrait_image_url: null,
      connection: "TEST ONLY. Fake connection.",
      motive: "TEST ONLY. Fake motive.",
    },
  ],
  clues: [
    {
      id: CASE99_CLUES.redSock,
      case_id: CASE99_ID,
      name: "Test red sock",
      icon_image_url: null,
      found_description: "TEST ONLY. A fake red sock.",
    },
    {
      id: CASE99_CLUES.blueSock,
      case_id: CASE99_ID,
      name: "Test blue sock",
      icon_image_url: null,
      found_description: "TEST ONLY. A fake blue sock.",
    },
    {
      id: CASE99_CLUES.rubberDuck,
      case_id: CASE99_ID,
      name: "Test rubber duck",
      icon_image_url: null,
      found_description: "TEST ONLY. A fake rubber duck.",
    },
  ],
};

export const case99Interrogations: Record<string, Interrogation> = {
  [CASE99_SUSPECTS.alpha]: {
    openingLine: "TEST ONLY. Hello, I am Test Suspect Alpha. I know nothing about any locker.",
    questions: [
      {
        id: "t99-alpha-where",
        text: "Where were you when the locker opened?",
        defaultAnswer: "TEST ONLY. Nowhere near it, promise.",
        unlockedByClueId: CASE99_CLUES.rubberDuck,
        confrontText: "TEST ONLY. This rubber duck was found inside the locker.",
        confrontedAnswer: "TEST ONLY. That is a very ordinary duck. Anyone could own a duck.",
      },
      {
        id: "t99-alpha-socks",
        text: "Do you own any socks?",
        defaultAnswer: "TEST ONLY. Everyone owns socks.",
        unlockedByClueId: CASE99_CLUES.redSock,
        confrontText: "TEST ONLY. This red sock was next to the locker.",
        confrontedAnswer: "TEST ONLY. Lots of people have red socks.",
      },
    ],
  },
  [CASE99_SUSPECTS.beta]: {
    openingLine: "TEST ONLY. I am Test Suspect Beta. Ask me anything.",
    questions: [
      {
        id: "t99-beta-where",
        text: "Where were you?",
        defaultAnswer: "TEST ONLY. At the pretend canteen.",
        unlockedByClueId: CASE99_CLUES.blueSock,
        confrontText: "TEST ONLY. This blue sock was next to the locker.",
        confrontedAnswer: "TEST ONLY. It is not even my colour.",
      },
      {
        id: "t99-beta-duck",
        text: "Have you seen a rubber duck?",
        defaultAnswer: "TEST ONLY. Not today.",
      },
    ],
  },
};
