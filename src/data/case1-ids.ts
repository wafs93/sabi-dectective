// Public ids for Case 1 (they match supabase/seed.sql). Safe to ship: every suspect
// and clue id is already visible to players. Which one is the answer is not.
export const CASE1_ID = "11111111-1111-4111-8111-000000000001";

export const CASE1_SUSPECTS = {
  chuks: "22222222-2222-4222-8222-000000000001",
  bisi: "22222222-2222-4222-8222-000000000002",
} as const;

export const CASE1_CLUES = {
  ledger: "33333333-3333-4333-8333-000000000001",
  securityLog: "33333333-3333-4333-8333-000000000002",
  footprint: "33333333-3333-4333-8333-000000000003",
} as const;
