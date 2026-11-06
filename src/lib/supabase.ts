import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE CLIENT (stage 10 / 12)
//
// Reads config from .env.local (see .env.example):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL
//
// If the keys are missing the app does not crash — the login
// screen shows a plain-English "not connected" notice instead
// (stage 07: never a raw error, always an honest state).
// ============================================================

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const email = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const adminEmail = email ?? "";

/** Everything the login screen needs before it can sign anyone in. */
export const isLoginReady = isSupabaseConfigured && adminEmail.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/** Plain-English failure used by every query guard (never raw DB copy). */
export function notConfiguredError(): Error {
  return new Error(
    "Supabase isn't connected yet — add your keys to .env.local (stages/13, Phase A), then restart the app."
  );
}
