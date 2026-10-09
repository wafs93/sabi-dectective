export type CaseRow = {
  id: string;
  case_number: number;
  title: string;
  briefing_text: string;
  scene_image_url: string | null;
  release_date: string | null;
  solution_suspect_id: string | null;
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
  is_red_herring: boolean;
};

export type CaseBundle = {
  caseData: CaseRow;
  suspects: Suspect[];
  clues: Clue[];
};

export type Contradiction = {
  suspectName: string;
  question: string;
  clueName: string;
  confrontText: string;
  answer: string;
};

export type Progress = {
  foundClueIds: string[];
  contradictions: Contradiction[];
};

export type ResultTier = "cracked" | "close" | "missed";

export type Accusation = {
  suspectId: string;
  citedClueIds: string[];
};
