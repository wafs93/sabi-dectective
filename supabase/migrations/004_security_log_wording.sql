-- Sabi Detective: reword the Case 1 security-log clue to match the scene art
-- (a logbook on Mama Chidinma's counter, not a gate guard's notebook).
-- Text only: same clue, same id, same meaning. Safe to run at any time, and more than once.

update public.clues
set found_description = 'Found on Mama Chidinma''s counter. Her logbook notes Alhaja Bisi closing up and leaving the market at 7pm, a full hour before the attack.'
where id = '33333333-3333-4333-8333-000000000002'
  and case_id = '11111111-1111-4111-8111-000000000001';
