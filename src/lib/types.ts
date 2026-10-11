// Everything in this file is safe to ship to the browser. The answer lives only on the server.

export type CaseRow = {
  id: string;
  case_number: number;
  title: string;
  briefing_text: string;
  scene_image_url: string | null;
  release_date: string | null;
};

export type Suspect = {
  id: string;
  case_id: string;
  name: string;
  portrait_image_url: string | null;
  connection: string | null;
  motive: string | null;
};

export type Clue = {
  id: string;
  case_id: string;
  name: string;
  icon_image_url: string | null;
  found_description: string | null;
};

export type CaseBundle = {
  caseData: CaseRow;
  suspects: Suspect[];
  clues: Clue[];
};

export type Contradiction = {
  suspectId: string;
  questionId: string;
  suspectName: string;
  question: string;
  clueName: string;
  confrontText: string;
  answer: string;
};

// A locked clue the player has unlocked, as the server returned it. Kept in saved
// progress so it still shows after a reload. Untrusted and for display only: it never
// affects scoring, which the server does from its own data.
export type UnlockedClue = {
  id: string;
  name: string;
  found_description: string | null;
  icon_image_url: string | null;
};

export type Progress = {
  foundClueIds: string[];
  contradictions: Contradiction[];
  // Only present once something is unlocked. Each id is also in foundClueIds.
  unlockedClues?: UnlockedClue[];
};

export type ResultTier = "cracked" | "close" | "missed";

export type Accusation = {
  suspectId: string;
  citedClueIds: string[];
};

// What POST /api/accuse returns. Never includes the solution or key clue ids.
export type AccusationResult = {
  outcome: ResultTier;
  title: string;
  explanation: string;
  feedback: string[];
};

export type SavedResult = {
  accusation: Accusation;
  result: AccusationResult;
};
