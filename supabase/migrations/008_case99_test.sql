-- Sabi Detective: Case 99 "Test Locker" (TEST DATA, for the Vercel Preview test only).
-- A fake case for trying locked clues on a Preview build with NEXT_PUBLIC_ENABLE_TEST_CASE=1.
-- Production builds never show Case 99. Remove it later with 009_case99_cleanup.sql.
--
-- Adds only Case 99's own rows; touches no existing row or table. Safe to run more than once:
-- rows that already exist are left as they are. Requires 001, 002 and 007.
-- Every text is obviously fake and starts "TEST ONLY". Ids match tests/fixtures/case99.ts.
--
-- Public tables get only the case, 2 suspects and 3 public clues.
-- Private tables get the answer, the 2 locked clues and the 2 unlock rules:
--   confront: Test Suspect Alpha + Test rubber duck   -> Test locked confession note
--   combine:  Test red sock + Test blue sock          -> Test locked matching pair
-- Cracking it needs Test Suspect Alpha and both locked clues.

begin;

-- ---- Public ----

insert into public.cases (id, case_number, title, briefing_text, scene_image_url, release_date)
values (
  '11111111-1111-4111-8111-000000000099',
  99,
  'Test Locker',
  'TEST ONLY. Fake briefing: a pretend locker was opened by a pretend person.',
  null,
  null
)
on conflict (id) do nothing;

insert into public.suspects (id, case_id, name, portrait_image_url, connection, motive)
values
  (
    '22222222-2222-4222-8222-000000009901',
    '11111111-1111-4111-8111-000000000099',
    'Test Suspect Alpha',
    null,
    'TEST ONLY. Fake connection.',
    'TEST ONLY. Fake motive.'
  ),
  (
    '22222222-2222-4222-8222-000000009902',
    '11111111-1111-4111-8111-000000000099',
    'Test Suspect Beta',
    null,
    'TEST ONLY. Fake connection.',
    'TEST ONLY. Fake motive.'
  )
on conflict (id) do nothing;

insert into public.clues (id, case_id, name, icon_image_url, found_description)
values
  (
    '33333333-3333-4333-8333-000000009901',
    '11111111-1111-4111-8111-000000000099',
    'Test red sock',
    null,
    'TEST ONLY. A fake red sock.'
  ),
  (
    '33333333-3333-4333-8333-000000009902',
    '11111111-1111-4111-8111-000000000099',
    'Test blue sock',
    null,
    'TEST ONLY. A fake blue sock.'
  ),
  (
    '33333333-3333-4333-8333-000000009903',
    '11111111-1111-4111-8111-000000000099',
    'Test rubber duck',
    null,
    'TEST ONLY. A fake rubber duck.'
  )
on conflict (id) do nothing;

-- ---- Private (server key only) ----

insert into public.case_solutions (
  case_id, solution_suspect_id, key_clue_ids, red_herring_clue_ids,
  cracked_title, cracked_text, close_title, close_text, missed_title, missed_text
)
values (
  '11111111-1111-4111-8111-000000000099',
  '22222222-2222-4222-8222-000000009901',
  array['33333333-3333-4333-8333-000000009904', '33333333-3333-4333-8333-000000009905']::uuid[],
  '{}'::uuid[],
  'Case Cracked',
  'TEST ONLY. Fake cracked text: the pretend locker case is closed and the pretend culprit owns up.',
  'Close Call',
  'TEST ONLY. Fake close text: right pretend culprit, but one pretend piece of evidence was missing.',
  'Missed It',
  'TEST ONLY. Fake missed text: {accused} was the wrong pretend person for this pretend locker.'
)
on conflict (case_id) do nothing;

insert into public.locked_clues (id, case_id, name, found_description, icon_image_url)
values
  (
    '33333333-3333-4333-8333-000000009904',
    '11111111-1111-4111-8111-000000000099',
    'Test locked confession note',
    'TEST ONLY. Fake locked text: the pretend suspect wrote a pretend note.',
    null
  ),
  (
    '33333333-3333-4333-8333-000000009905',
    '11111111-1111-4111-8111-000000000099',
    'Test locked matching pair',
    'TEST ONLY. Fake locked text: the two pretend socks make a pretend pair.',
    null
  )
on conflict (id) do nothing;

insert into public.clue_unlocks (id, case_id, kind, suspect_id, source_clue_ids, unlocks_clue_id)
values
  (
    '44444444-4444-4444-8444-000000009901',
    '11111111-1111-4111-8111-000000000099',
    'confront',
    '22222222-2222-4222-8222-000000009901',
    array['33333333-3333-4333-8333-000000009903']::uuid[],
    '33333333-3333-4333-8333-000000009904'
  ),
  (
    '44444444-4444-4444-8444-000000009902',
    '11111111-1111-4111-8111-000000000099',
    'combine',
    null,
    array['33333333-3333-4333-8333-000000009901', '33333333-3333-4333-8333-000000009902']::uuid[],
    '33333333-3333-4333-8333-000000009905'
  )
on conflict (id) do nothing;

commit;
