-- Sabi Detective: Case 2 "The Second Buyer" (private answer).
-- Adds Case 2's row to the private case_solutions table that only the server can read.
-- Never touches Case 1. Safe to run more than once: it rewrites only Case 2's row.
-- Requires 002 and 005_case2.sql.
--
-- Key clues (both needed for "cracked"): the toll receipt and the second sale agreement.
-- Red herrings: Uncle Dele's final notice and Ada's torn note. The safe key log is neither.

insert into public.case_solutions (
  case_id, solution_suspect_id, key_clue_ids, red_herring_clue_ids,
  cracked_title, cracked_text, close_title, close_text, missed_title, missed_text
)
values (
  '11111111-1111-4111-8111-000000000002',
  '22222222-2222-4222-8222-000000000202',
  array['33333333-3333-4333-8333-000000000201', '33333333-3333-4333-8333-000000000202']::uuid[],
  array['33333333-3333-4333-8333-000000000204', '33333333-3333-4333-8333-000000000205']::uuid[],
  'Case Cracked',
  'Barrister Kunle''s calm finally broke. He had sold Plot 14 twice, the second time to Chief Ibe on a forged deed he witnessed himself. The original Certificate of Occupancy would have exposed him at tomorrow''s sale, so he slipped back from "Abuja" in the night and took it from the safe to stall everything. The toll receipt and the second agreement left him nowhere to hide. Sharp work, Detective.',
  'Close Call',
  'Barrister Kunle is arrested and the family gets their deed back, but your case had holes. A good defence lawyer would have had a field day with it. Look for the second piece of evidence next time.',
  'Missed It',
  '{accused} didn''t take the deed, and the case collapsed before it started. While you chased the wrong person, Barrister Kunle quietly smoothed things over with the family. The toll receipt and the second agreement pointed at him all along.'
)
on conflict (case_id) do update set
  solution_suspect_id = excluded.solution_suspect_id,
  key_clue_ids = excluded.key_clue_ids,
  red_herring_clue_ids = excluded.red_herring_clue_ids,
  cracked_title = excluded.cracked_title,
  cracked_text = excluded.cracked_text,
  close_title = excluded.close_title,
  close_text = excluded.close_text,
  missed_title = excluded.missed_title,
  missed_text = excluded.missed_text;
