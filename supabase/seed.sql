-- Sabi Detective: Case 1 "The Empty Stall"
-- Safe to re-run: removes any existing Case 1 (suspects and clues cascade) first.

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

insert into public.clues (id, case_id, name, icon_image_url, found_description, is_red_herring)
values
  (
    '33333333-3333-4333-8333-000000000001',
    '11111111-1111-4111-8111-000000000001',
    'Torn wage ledger page',
    null,
    'Found on the stall floor under an overturned basket. Shows Chuks was owed back pay, confirming the argument was about money.',
    false
  ),
  (
    '33333333-3333-4333-8333-000000000002',
    '11111111-1111-4111-8111-000000000001',
    'Market security log',
    null,
    'From the gate guard''s notebook. Logs Alhaja Bisi leaving the market at 7pm, a full hour before the attack.',
    false
  ),
  (
    '33333333-3333-4333-8333-000000000003',
    '11111111-1111-4111-8111-000000000001',
    'Muddy footprint',
    null,
    'Leads from the stall to the back alley. Matches the work boots Chuks wears, not Alhaja Bisi''s sandals.',
    false
  );

update public.cases
set solution_suspect_id = (
  select id from public.suspects
  where case_id = '11111111-1111-4111-8111-000000000001' and name = 'Chuks'
)
where id = '11111111-1111-4111-8111-000000000001';

commit;
