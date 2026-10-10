import type { CaseSolution } from "@/engine/scoring";
import type { ScoringData } from "@/server/accuse";

export const CASE_ID = "11111111-1111-4111-8111-000000000001";
export const CHUKS = "22222222-2222-4222-8222-000000000001";
export const BISI = "22222222-2222-4222-8222-000000000002";
export const LEDGER = "33333333-3333-4333-8333-000000000001";
export const GATE_LOG = "33333333-3333-4333-8333-000000000002";
export const FOOTPRINT = "33333333-3333-4333-8333-000000000003";

export const solution: CaseSolution = {
  solutionSuspectId: CHUKS,
  keyClueIds: [LEDGER, FOOTPRINT],
  redHerringClueIds: [],
  texts: {
    cracked: { title: "Case Cracked", text: "Cracked text." },
    close: { title: "Close Call", text: "Close text." },
    missed: { title: "Missed It", text: "{accused} didn't do it." },
  },
};

export const scoringData: ScoringData = {
  solution,
  suspects: [
    { id: CHUKS, name: "Chuks" },
    { id: BISI, name: "Alhaja Bisi" },
  ],
  clueIds: [LEDGER, GATE_LOG, FOOTPRINT],
};

// Things the browser must never receive.
export const SECRETS = [CHUKS, LEDGER, FOOTPRINT, "solutionSuspectId", "keyClueIds", "redHerring"];
