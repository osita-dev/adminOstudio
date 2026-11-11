import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE CLIENT (stage 10 / 12)
//
// Reads config from .env.local:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//   VITE_SIGNUP_ALLOWED_DOMAIN  → e.g. ostudioinnovations.com
//   VITE_SIGNUP_ALLOWED_EMAILS  → comma-separated exact addresses
//
// If the keys are missing the app does not crash — the login
// screen shows a plain-English "not connected" notice instead
// (stage 07: never a raw error, always an honest state).
// ============================================================

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const domain = (
  (import.meta.env.VITE_SIGNUP_ALLOWED_DOMAIN as string | undefined) ?? ""
)
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

const emails = (
  (import.meta.env.VITE_SIGNUP_ALLOWED_EMAILS as string | undefined) ?? ""
)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Everything the auth screens need before they can talk to Supabase. */
export const isLoginReady = isSupabaseConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/** True when at least one sign-up rule is configured. */
export const isSignUpOpen = Boolean(domain || emails.length > 0);

/**
 * Who may create an account: exact addresses from
 * VITE_SIGNUP_ALLOWED_EMAILS plus every address under
 * VITE_SIGNUP_ALLOWED_DOMAIN. With no rules, sign-up stays shut.
 */
export function canSignUp(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!value || !isSignUpOpen) return false;
  if (emails.includes(value)) return true;
  if (domain && value.endsWith(`@${domain}`)) return true;
  return false;
}

/** Plain-English failure used by every query guard (never raw DB copy). */
export function notConfiguredError(): Error {
  return new Error(
    "Supabase isn't connected yet — add your keys to .env.local (stages/13, Phase A), then restart the app."
  );
}
