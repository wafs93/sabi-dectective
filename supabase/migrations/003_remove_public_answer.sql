-- Sabi Detective: Stage 2 (REMOVAL).
--
-- !!! DO NOT RUN until the new code (server-side /api/accuse) is deployed to Vercel
-- !!! and you have verified a full Case 1 play-through on the live site.
-- !!! The old deployed code reads these columns; running this early breaks it.
--
-- Removes the answer from the publicly readable tables. The answer now lives only in
-- public.case_solutions (see 002_private_solutions.sql), which the public key cannot read.

begin;

-- Dropping the column also drops cases_solution_suspect_id_fkey.
alter table public.cases drop column if exists solution_suspect_id;
alter table public.clues drop column if exists is_red_herring;

commit;
