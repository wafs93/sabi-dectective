-- Sabi Detective: Case 2 "The Second Buyer" (public story: case, suspects, clues).
-- Additive only: inserts Case 2's rows and never touches Case 1.
-- Safe to run more than once: rows that already exist are left as they are.
-- Requires 001. Works before and after 003. Run 006_case2_solution.sql after this one.
-- Image fields stay empty until the Case 2 art is added.

begin;

insert into public.cases (id, case_number, title, briefing_text, scene_image_url, release_date)
values (
  '11111111-1111-4111-8111-000000000002',
  2,
  'The Second Buyer',
  'Mama Nkechi''s family land at Ajah is due to be sold to a developer tomorrow morning. Tonight the original Certificate of Occupancy vanished from the family safe. Find out who took it, and why.',
  null,
  null
)
on conflict (id) do nothing;

insert into public.suspects (id, case_id, name, portrait_image_url, connection, motive)
values
  (
    '22222222-2222-4222-8222-000000000201',
    '11111111-1111-4111-8111-000000000002',
    'Uncle Dele',
    null,
    'Mama Nkechi''s brother-in-law. Deep in debt and loud about the sale.',
    'Says the family is being cheated, and was at the house tonight.'
  ),
  (
    '22222222-2222-4222-8222-000000000202',
    '11111111-1111-4111-8111-000000000002',
    'Barrister Kunle',
    null,
    'Barrister Adekunle Balogun, the family lawyer. Calm and helpful.',
    'Drew up the sale papers. Says he was in Abuja that night.'
  ),
  (
    '22222222-2222-4222-8222-000000000203',
    '11111111-1111-4111-8111-000000000002',
    'Ada',
    null,
    'Mama Nkechi''s housekeeper for eleven years.',
    'Knows the safe code, and is clearly hiding something.'
  ),
  (
    '22222222-2222-4222-8222-000000000204',
    '11111111-1111-4111-8111-000000000002',
    'Alhaji Musa',
    null,
    'Agent for the developer buying the land.',
    'Pushing hard for the sale to go through tomorrow.'
  )
on conflict (id) do nothing;

insert into public.clues (id, case_id, name, icon_image_url, found_description)
values
  (
    '33333333-3333-4333-8333-000000000201',
    '11111111-1111-4111-8111-000000000002',
    'Toll receipt, 01:48',
    null,
    'Found on the back seat of Barrister Kunle''s car, parked outside the house. A Lekki toll gate receipt stamped 01:48 last night. It puts him in Lagos, not Abuja.'
  ),
  (
    '33333333-3333-4333-8333-000000000202',
    '11111111-1111-4111-8111-000000000002',
    'Second sale agreement',
    null,
    'Found folded under the blotter on the study desk. A sale agreement for Plot 14. First Buyer: Greenfield Homes Ltd. Second Buyer: Chief R. Ibe. Seller: Mrs N. Okafor. Witnessed by A. O. Balogun.'
  ),
  (
    '33333333-3333-4333-8333-000000000203',
    '11111111-1111-4111-8111-000000000002',
    'Safe key log',
    null,
    'Found open on the study desk beside the empty safe. It lists two keys: "Family key - Mama Nkechi" and "Lawyer''s key - A.O.B."'
  ),
  (
    '33333333-3333-4333-8333-000000000204',
    '11111111-1111-4111-8111-000000000002',
    'Uncle Dele''s final notice',
    null,
    'Found in a pile of unopened envelopes on the study side table. A FINAL NOTICE addressed to Uncle Dele: N2,450,000 owed.'
  ),
  (
    '33333333-3333-4333-8333-000000000205',
    '11111111-1111-4111-8111-000000000002',
    'Ada''s torn note',
    null,
    'Found on the kitchen table beside the suya spice jar, in Ada''s handwriting: "...the back gate... by midnight... don''t let him see... HURRY!"'
  )
on conflict (id) do nothing;

commit;
