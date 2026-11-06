import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminEmail, isLoginReady, supabase } from "@/lib/supabase";

// ============================================================
// LOGIN (stage 06 / 07) — one password field, no sign-up, no
// "create account". The single admin account comes from
// VITE_ADMIN_EMAIL; wrong password → inline retry; fifth
// wrong try → 3-second backoff.
// ============================================================

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedSeconds, setLockedSeconds] = useState(0);

  // Backoff countdown (stage 07: 3s pause after five bad tries).
  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const timer = setTimeout(() => setLockedSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [lockedSeconds]);

  if (signedIn) return <Navigate to="/" replace />;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !isLoginReady || busy || lockedSeconds > 0) return;

    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password,
    });

    setBusy(false);

    if (signInError) {
      // Logged for debugging, never shown raw (stage 07).
      console.error("[admin] sign-in failed:", signInError.message);

      if (/rate|too many/i.test(signInError.message)) {
        setError("Too many attempts — wait a moment and try again.");
        return;
      }

      const next = attempts + 1;
      if (next >= 5) {
        setAttempts(0);
        setLockedSeconds(3);
        setError("Too many attempts — wait 3 seconds before trying again.");
      } else {
        setAttempts(next);
        setError("Wrong password — try again.");
      }
      return;
    }

    setSignedIn(true);
  };

  return (
    <div className="grid min-h-screen place-content-center bg-hero-gradient px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/95 p-8 shadow-soft">
        <img
          src="/OstudioInnovation.svg"
          alt="O Studio Innovations"
          className="mx-auto h-14 w-auto object-contain"
        />
        <p className="mt-4 text-center text-[11px] tracking-widest-plus uppercase text-primary">
          O Studio Innovations
        </p>
        <h1 className="mt-1 text-center font-serif-display text-2xl">Admin</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter the password to continue.
        </p>

        {!isLoginReady && (
          <div className="mt-5 flex gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-600">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Supabase isn't connected yet — copy <span className="font-mono">.env.example</span>{" "}
              to <span className="font-mono">.env.local</span> and fill in{" "}
              <span className="font-mono">VITE_SUPABASE_URL</span>,{" "}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> and{" "}
              <span className="font-mono">VITE_ADMIN_EMAIL</span> (stages/13, Phase A), then
              restart the app.
            </span>
          </div>
        )}

        <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!isLoginReady || lockedSeconds > 0}
              placeholder={lockedSeconds > 0 ? `Wait ${lockedSeconds}s…` : "••••••••"}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={!isLoginReady || busy || lockedSeconds > 0 || password.length === 0}
          >
            <KeyRound size={15} />
            {busy ? "Checking…" : "Enter"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          O Studio Innovations · internal
        </p>
      </div>
    </div>
  );
}
