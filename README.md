# Sabi Detective

A daily Nigerian crime-case detective game. Read the briefing, question suspects, collect clues, and make your accusation.

This is the first playable version: **Case 1, "The Empty Stall"**.

**Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Supabase, deployed on Vercel.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Create the tables.** In the Supabase dashboard, open **SQL Editor**, paste the contents of
   [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) and run it.

4. **Add the private answer table.** In the SQL Editor, run
   [`supabase/migrations/002_private_solutions.sql`](supabase/migrations/002_private_solutions.sql).
   Then run [`003_remove_public_answer.sql`](supabase/migrations/003_remove_public_answer.sql)
   (on an existing live project, only after the new code is deployed; see the comment in the file).

5. **Load Case 1.** In the SQL Editor, paste the contents of [`supabase/seed.sql`](supabase/seed.sql) and run it.
   The seed can be re-run safely; it replaces Case 1.

6. **Add your keys.** Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API** in Supabase.
   The service role key is server-only: it is used by `/api/accuse` to read the answer.
   Never give it a `NEXT_PUBLIC_` prefix.

7. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

If Supabase isn't configured (or can't be reached), the game falls back to a built-in copy of Case 1 so the story can still be read. The opening screen shows "Offline case file" when that happens. Accusations are always checked by the server (`POST /api/accuse`), so submitting one needs a connection.

## Checks

```bash
npm run lint
npm run typecheck
npm test                     # Vitest unit and route tests
npm run check:bundle         # builds, then confirms no answer data ships to the browser
npm run check:public-access  # with only the anon key, confirms the answer can't be read
```

## How it's organised

| Path | What it holds |
| --- | --- |
| `supabase/migrations/001_init.sql` | `cases`, `suspects`, `clues` tables with public read-only RLS |
| `supabase/migrations/002_private_solutions.sql` | Private `case_solutions` table (answer, key clues, result texts) |
| `supabase/migrations/003_remove_public_answer.sql` | Drops the old public answer columns |
| `src/app/api/accuse/route.ts` | Server-side answer check |
| `src/engine/scoring.ts` | Deterministic scoring (Cracked / Close / Missed) |
| `src/server/` | Server-only code: request validation, rate limit, answer loading |
| `supabase/seed.sql` | Case 1 data |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/game.ts` | Case loading, localStorage progress and last result |
| `src/data/interrogations.ts` | Interrogation dialogue, keyed by suspect id |
| `src/data/case1-fallback.ts` | Offline copy of Case 1's story (no answer) |
| `src/components/` | Screens: opening, investigate, interrogation, accuse, result |

Player progress (collected clues and contradictions) is saved in `localStorage`. "Play again" clears it.

## Art

All art is placeholder blocks for now. To use real images, set these columns in Supabase:

- `cases.scene_image_url` (16:9)
- `suspects.portrait_image_url` (3:4)
- `clues.icon_image_url` (1:1)

## Deploying to Vercel

Import the repo in Vercel and add the same three environment variables: the two `NEXT_PUBLIC_SUPABASE_*` ones and `SUPABASE_SERVICE_ROLE_KEY`.
