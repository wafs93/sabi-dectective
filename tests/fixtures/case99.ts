import type { Interrogation } from "@/data/interrogations";
import type { CaseSolution } from "@/engine/scoring";
import type { CaseBundle } from "@/lib/types";
import type { UnlockRule } from "@/server/unlocks";

// Case 99 "Test Locker": a fake case for developing locked clues. Tests only.
// It must never be imported by app code or shipped: tests/unlocks.test.ts fails if
// anything under src/ refers to it.

export const CASE99_ID = "11111111-1111-4111-8111-000000000099";

export const CASE99_SUSPECTS = {
  alpha: "22222222-2222-4222-8222-000000009901",
  beta: "22222222-2222-4222-8222-000000009902",
} as const;

// Public clues: found in the scene like any other clue.
export const CASE99_CLUES = {
  redSock: "33333333-3333-4333-8333-000000009901",
  blueSock: "33333333-3333-4333-8333-000000009902",
  rubberDuck: "33333333-3333-4333-8333-000000009903",
} as const;

// Locked clues: hidden until the player unlocks them.
export const CASE99_LOCKED = {
  // Confront Test Suspect Alpha with the rubber duck.
  confessionNote: "33333333-3333-4333-8333-000000009904",
  // Connect the red sock and the blue sock.
  matchingPair: "33333333-3333-4333-8333-000000009905",
} as const;

export const case99Public: CaseBundle = {
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

// What the private locked_clues table will hold. Never in the public bundle.
export const case99LockedClues = [
  {
    id: CASE99_LOCKED.confessionNote,
    case_id: CASE99_ID,
    name: "Test locked confession note",
    icon_image_url: null,
    found_description: "TEST ONLY. Fake locked text: the pretend suspect wrote a pretend note.",
  },
  {
    id: CASE99_LOCKED.matchingPair,
    case_id: CASE99_ID,
    name: "Test locked matching pair",
    icon_image_url: null,
    found_description: "TEST ONLY. Fake locked text: the two pretend socks make a pretend pair.",
  },
];

// What the private clue_unlocks table will hold.
export const case99Rules: UnlockRule[] = [
  {
    kind: "confront",
    suspectId: CASE99_SUSPECTS.alpha,
    clueId: CASE99_CLUES.rubberDuck,
    unlocksClueId: CASE99_LOCKED.confessionNote,
  },
  {
    kind: "combine",
    clueIds: [CASE99_CLUES.redSock, CASE99_CLUES.blueSock],
    unlocksClueId: CASE99_LOCKED.matchingPair,
  },
];

// Public dialogue: what the app's flag-gated copy shows (src/data/test-case/case99.ts).
// Alpha confronted with the rubber duck is the confront unlock. Nothing here names the culprit.
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

// The private answer (what 008_case99_test.sql puts in case_solutions). Server only.
// Cracking it needs both locked clues, so the test exercises both unlocks.
export const case99Solution: CaseSolution = {
  solutionSuspectId: CASE99_SUSPECTS.alpha,
  keyClueIds: [CASE99_LOCKED.confessionNote, CASE99_LOCKED.matchingPair],
  redHerringClueIds: [],
  texts: {
    cracked: {
      title: "Case Cracked",
      text: "TEST ONLY. Fake cracked text: the pretend locker case is closed and the pretend culprit owns up.",
    },
    close: {
      title: "Close Call",
      text: "TEST ONLY. Fake close text: right pretend culprit, but one pretend piece of evidence was missing.",
    },
    missed: {
      title: "Missed It",
      text: "TEST ONLY. Fake missed text: {accused} was the wrong pretend person for this pretend locker.",
    },
  },
};

// Fixed ids for the two clue_unlocks rows, so 008 can be re-run without duplicates.
export const CASE99_RULE_IDS = {
  confront: "44444444-4444-4444-8444-000000009901",
  combine: "44444444-4444-4444-8444-000000009902",
} as const;
