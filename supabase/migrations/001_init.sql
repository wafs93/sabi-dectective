-- Sabi Detective: initial schema
-- Three tables: cases, suspects, clues. Public read-only access via RLS.

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number int unique not null,
  title text not null,
  briefing_text text not null,
  scene_image_url text,
  release_date date,
  solution_suspect_id uuid
);

create table public.suspects (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  name text not null,
  portrait_image_url text,
  connection text,
  motive text
);

create table public.clues (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  name text not null,
  icon_image_url text,
  found_description text,
  is_red_herring boolean not null default false
);

-- The solution FK can only be added once suspects exists.
alter table public.cases
  add constraint cases_solution_suspect_id_fkey
  foreign key (solution_suspect_id) references public.suspects (id) on delete set null;

create index suspects_case_id_idx on public.suspects (case_id);
create index clues_case_id_idx on public.clues (case_id);

-- Row level security: anyone can read, nobody can write through the API.
alter table public.cases enable row level security;
alter table public.suspects enable row level security;
alter table public.clues enable row level security;

create policy "Public read access to cases"
  on public.cases for select
  to anon, authenticated
  using (true);

create policy "Public read access to suspects"
  on public.suspects for select
  to anon, authenticated
  using (true);

create policy "Public read access to clues"
  on public.clues for select
  to anon, authenticated
  using (true);
