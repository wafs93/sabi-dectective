-- Sabi Detective: Stage 1 (ADDITIVE). Safe to run while the current site is live.
-- Adds a private case_solutions table that only the server (service role key) can read.
-- Nothing is removed from the public tables here; see 003_remove_public_answer.sql for that.

create table if not exists public.case_solutions (
  case_id uuid primary key references public.cases (id) on delete cascade,
  solution_suspect_id uuid not null references public.suspects (id) on delete cascade,
  -- Every one of these clue ids must be cited (with the right suspect) for "cracked".
  key_clue_ids uuid[] not null default '{}',
  red_herring_clue_ids uuid[] not null default '{}',
  cracked_title text not null,
  cracked_text text not null,
  close_title text not null,
  close_text text not null,
  missed_title text not null,
  -- "{accused}" is replaced with the accused suspect's name by the server.
  missed_text text not null
);

-- RLS on with no policies: the anon and authenticated roles can read nothing.
-- The service role bypasses RLS. Grants are revoked as a second layer.
alter table public.case_solutions enable row level security;
revoke all on table public.case_solutions from anon, authenticated;

-- Case 1 "The Empty Stall" (ids match supabase/seed.sql).
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
