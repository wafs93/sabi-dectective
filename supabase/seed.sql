-- Sabi Detective: Case 1 "The Empty Stall"
-- Safe to re-run: removes any existing Case 1 (suspects, clues and solution cascade) first.
-- Requires migrations 001 and 002. Works before and after 003.

begin;

delete from public.cases where case_number = 1;

insert into public.cases (id, case_number, title, briefing_text, scene_image_url, release_date)
values (
  '11111111-1111-4111-8111-000000000001',
  1,
  'The Empty Stall',
  'Welcome, Detective. Your first case. Mama Chidinma, a well-known trader at Ladipo Market, was found knocked unconscious in her stall early this morning. Her cash box was missing. She''s alive, recovering in hospital, and awake enough to say only one thing: she argued with someone about money the night before it happened. Two people in the market had reason to want her cash box gone. Question them both, follow the clues, and work out who really did it.',
  null,
  current_date
);

insert into public.suspects (id, case_id, name, portrait_image_url, connection, motive)
values
  (
    '22222222-2222-4222-8222-000000000001',
    '11111111-1111-4111-8111-000000000001',
    'Chuks',
    null,
    'Stall boy who worked for Mama Chidinma, owed back pay for two months.',
    'Angry about unpaid wages, heard arguing with her the evening before.'
  ),
  (
    '22222222-2222-4222-8222-000000000002',
    '11111111-1111-4111-8111-000000000001',
    'Alhaja Bisi',
    null,
    'Rival trader in the stall next door.',
    'Long-running rivalry over customers, but no history of violence.'
  );

insert into public.clues (id, case_id, name, icon_image_url, found_description)
values
  (
    '33333333-3333-4333-8333-000000000001',
    '11111111-1111-4111-8111-000000000001',
    'Torn wage ledger page',
    null,
    'Found on the stall floor under an overturned basket. Shows Chuks was owed back pay, confirming the argument was about money.'
  ),
  (
    '33333333-3333-4333-8333-000000000002',
    '11111111-1111-4111-8111-000000000001',
    'Market security log',
    null,
    'Found on Mama Chidinma''s counter. Her logbook notes Alhaja Bisi closing up and leaving the market at 7pm, a full hour before the attack.'
  ),
  (
    '33333333-3333-4333-8333-000000000003',
    '11111111-1111-4111-8111-000000000001',
    'Muddy footprint',
    null,
    'Leads from the stall to the back alley. Matches the work boots Chuks wears, not Alhaja Bisi''s sandals.'
  );

-- The answer lives in the private case_solutions table (see 002_private_solutions.sql).
insert into public.case_solutions (
  case_id, solution_suspect_id, key_clue_ids, red_herring_clue_ids,
  cracked_title, cracked_text, close_title, close_text, missed_title, missed_text
)
values (
  '11111111-1111-4111-8111-000000000001',
  '22222222-2222-4222-8222-000000000001',
  array['33333333-3333-4333-8333-000000000001', '33333333-3333-4333-8333-000000000003']::uuid[],
  '{}'::uuid[],
  'Case Cracked',
  'Chuks broke down. Ignored over his unpaid wages, he came back that night to confront Mama Chidinma, and it turned physical when she dismissed him. The ledger and the footprint left him no way out. Sharp work, Detective.',
  'Close Call',
  'Chuks is arrested, but your case had gaps. He confessed in the end, though a smarter lawyer would have picked it apart. Look for the second piece of evidence next time.',
  'Missed It',
  '{accused} didn''t do it, and the case fell apart in front of the magistrate. While you chased the wrong lead, Chuks walked free. The unpaid wages and the muddy boots pointed at him all along.'
);

-- Until 003 drops it, the old public column is still read by older deployments. Keep it filled.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cases' and column_name = 'solution_suspect_id'
  ) then
    execute $sql$
      update public.cases
      set solution_suspect_id = '22222222-2222-4222-8222-000000000001'
      where id = '11111111-1111-4111-8111-000000000001'
    $sql$;
  end if;
end
$$;

commit;
