-- Sabi Detective: Case 3 "The Clean Money" (private: the "Missed It" text).
-- The old text said "{accused} didn't wash the money", which is untrue for Dr. Sanni Bello: he ran
-- the books, but on someone else's order. There is one Missed It text per case (the server puts the
-- accused's name in place of {accused}), so this rewords it to be true for every wrong suspect,
-- Sanni included. It names and describes no one but the accused: the old text named the culprit.
-- Updates only Case 3's case_solutions row. Safe to run more than once.
-- Requires 002 and 011_case3_private.sql.

begin;

update public.case_solutions
set missed_text = '{accused} wasn''t the one giving the orders, and the case fell apart in court. While you chased the wrong person, the real money trail went quiet, and whoever was behind it walked away untouched.'
where case_id = '11111111-1111-4111-8111-000000000003';

commit;
