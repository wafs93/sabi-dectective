import type { UnlockRule } from "@/server/unlocks";
import type { CaseBundle } from "@/lib/types";

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
