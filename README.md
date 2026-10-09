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

4. **Load Case 1.** In the SQL Editor, paste the contents of [`supabase/seed.sql`](supabase/seed.sql) and run it.
   The seed can be re-run safely; it replaces Case 1.

5. **Add your keys.** Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   **Project Settings → API** in Supabase.

6. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

If Supabase isn't configured (or can't be reached), the game falls back to a built-in copy of Case 1 so it stays playable. The opening screen shows "Offline case file" when that happens.

## How it's organised

| Path | What it holds |
| --- | --- |
| `supabase/migrations/001_init.sql` | `cases`, `suspects`, `clues` tables with public read-only RLS |
| `supabase/seed.sql` | Case 1 data |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/game.ts` | Case loading, accusation scoring, localStorage progress |
| `src/data/interrogations.ts` | Interrogation dialogue, keyed by suspect name |
| `src/data/outcomes.ts` | Key evidence and result texts per case |
| `src/data/case1-fallback.ts` | Offline copy of Case 1 |
| `src/components/` | Screens: opening, investigate, interrogation, accuse, result |

Player progress (collected clues and contradictions) is saved in `localStorage`. "Play again" clears it.

## Art

All art is placeholder blocks for now. To use real images, set these columns in Supabase:

- `cases.scene_image_url` (16:9)
- `suspects.portrait_image_url` (3:4)
- `clues.icon_image_url` (1:1)

## Deploying to Vercel

Import the repo in Vercel and add the same two `NEXT_PUBLIC_SUPABASE_*` environment variables.
