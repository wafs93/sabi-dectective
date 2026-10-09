import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function isHttpsUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = isHttpsUrl(supabaseUrl) && Boolean(supabaseAnonKey);

function makeClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Could not create Supabase client, using local data.", err);
    return null;
  }
}

// null when the env vars are missing or invalid, so the app can still build and fall back to local data.
export const supabase: SupabaseClient | null = makeClient();
