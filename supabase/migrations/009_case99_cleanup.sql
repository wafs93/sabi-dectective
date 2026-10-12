-- Sabi Detective: remove Case 99 "Test Locker" (TEST DATA cleanup, for the Vercel Preview test only).
-- Deletes exactly the rows 008_case99_test.sql inserted, by their ids, and nothing else.
-- Safe to run more than once, and safe to run if 008 was never run.
-- The case row is deleted last, and only if no other row still points to it, so its
-- "on delete cascade" can never remove anything 008 didn't add.

begin;

delete from public.clue_unlocks
where id in ('44444444-4444-4444-8444-000000009901', '44444444-4444-4444-8444-000000009902')
  and case_id = '11111111-1111-4111-8111-000000000099';

delete from public.locked_clues
where id in ('33333333-3333-4333-8333-000000009904', '33333333-3333-4333-8333-000000009905')
  and case_id = '11111111-1111-4111-8111-000000000099';

delete from public.case_solutions
where case_id = '11111111-1111-4111-8111-000000000099'
  and solution_suspect_id = '22222222-2222-4222-8222-000000009901';

delete from public.clues
where id in (
    '33333333-3333-4333-8333-000000009901',
    '33333333-3333-4333-8333-000000009902',
    '33333333-3333-4333-8333-000000009903'
  )
  and case_id = '11111111-1111-4111-8111-000000000099';

delete from public.suspects
where id in ('22222222-2222-4222-8222-000000009901', '22222222-2222-4222-8222-000000009902')
  and case_id = '11111111-1111-4111-8111-000000000099';

delete from public.cases c
where c.id = '11111111-1111-4111-8111-000000000099'
  and c.case_number = 99
  and c.title = 'Test Locker'
  and not exists (select 1 from public.suspects s where s.case_id = c.id)
  and not exists (select 1 from public.clues k where k.case_id = c.id)
  and not exists (select 1 from public.case_solutions x where x.case_id = c.id)
  and not exists (select 1 from public.locked_clues l where l.case_id = c.id)
  and not exists (select 1 from public.clue_unlocks u where u.case_id = c.id);

commit;
