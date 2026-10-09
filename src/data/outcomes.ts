import type { ResultTier } from "@/lib/types";

// Per-case scoring rules and narrative reveals, keyed by case_number.
export type CaseOutcomes = {
  // Clue names that must all be cited (with the right suspect) to crack the case.
  keyEvidence: string[];
  results: Record<ResultTier, { title: string; text: string }>;
};

export const outcomes: Record<number, CaseOutcomes> = {
  1: {
    keyEvidence: ["Torn wage ledger page", "Muddy footprint"],
    results: {
      cracked: {
        title: "Case Cracked",
        text: "Chuks broke down. Ignored over his unpaid wages, he came back that night to confront Mama Chidinma, and it turned physical when she dismissed him. The ledger and the footprint left him no way out. Sharp work, Detective.",
      },
      close: {
        title: "Close Call",
        text: "Chuks is arrested, but your case had gaps. He confessed in the end, though a smarter lawyer would have picked it apart. Look for the second piece of evidence next time.",
      },
      missed: {
        title: "Missed It",
        text: "Alhaja Bisi had left at 7pm, and the gate log proves it. Meanwhile Chuks walked free. The real story got buried.",
      },
    },
  },
};
