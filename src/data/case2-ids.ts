// Public ids for Case 2 (they match supabase/migrations/005_case2.sql and seed.sql). Safe to
// ship: every suspect and clue id is already visible to players. Which one is the answer is not.
// The 2xx endings keep them apart from Case 1's ids.
export const CASE2_ID = "11111111-1111-4111-8111-000000000002";

export const CASE2_SUSPECTS = {
  dele: "22222222-2222-4222-8222-000000000201",
  kunle: "22222222-2222-4222-8222-000000000202",
  ada: "22222222-2222-4222-8222-000000000203",
  musa: "22222222-2222-4222-8222-000000000204",
} as const;

export const CASE2_CLUES = {
  tollReceipt: "33333333-3333-4333-8333-000000000201",
  secondAgreement: "33333333-3333-4333-8333-000000000202",
  keyLog: "33333333-3333-4333-8333-000000000203",
  debtLetter: "33333333-3333-4333-8333-000000000204",
  tornNote: "33333333-3333-4333-8333-000000000205",
} as const;
