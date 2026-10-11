-- Sabi Detective: locked clues (ADDITIVE). Safe to run while the site is live.
-- Adds two private tables that only the server (service role key) can read:
--   locked_clues  the hidden clues' content, per case
--   clue_unlocks  the rules that reveal them
-- Creates no rows and changes no existing table or row. Safe to run more than once.
-- Locked clue ids use the same UUID style as other clues but must never be inserted
-- into the public clues table (scripts/check-bundle.mjs checks the SQL files for this).

create table if not exists public.locked_clues (
  id uuid primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  name text not null,
  found_description text,
  -- A random file name under public/art/locked/, or null for no image.
  icon_image_url text check (
    icon_image_url is null
    or icon_image_url ~ '^/art/locked/[A-Za-z0-9_-]{1,100}\.(jpe?g|png|webp)$'
  )
);

create table if not exists public.clue_unlocks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  -- confront: suspect_id confronted with source_clue_ids[1] reveals unlocks_clue_id.
  -- combine:  source_clue_ids[1] connected with source_clue_ids[2] (either order) reveals it.
  kind text not null check (kind in ('confront', 'combine')),
  suspect_id uuid references public.suspects (id) on delete cascade,
  -- A source clue may be a public clue or an already unlocked locked clue.
  source_clue_ids uuid[] not null,
  unlocks_clue_id uuid not null references public.locked_clues (id) on delete cascade,
  constraint clue_unlocks_shape check (
    array_ndims(source_clue_ids) = 1
    and array_position(source_clue_ids, null) is null
    and (
      (kind = 'confront' and suspect_id is not null and cardinality(source_clue_ids) = 1)
      or (
        kind = 'combine'
        and suspect_id is null
        and cardinality(source_clue_ids) = 2
        and source_clue_ids[1] <> source_clue_ids[2]
      )
    )
  )
);

create index if not exists locked_clues_case_id_idx on public.locked_clues (case_id);
create index if not exists clue_unlocks_case_id_idx on public.clue_unlocks (case_id);

-- RLS on with no policies: the anon and authenticated roles can read nothing.
-- The service role bypasses RLS. Grants are revoked as a second layer.
alter table public.locked_clues enable row level security;
revoke all on table public.locked_clues from anon, authenticated;

alter table public.clue_unlocks enable row level security;
revoke all on table public.clue_unlocks from anon, authenticated;
