import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canSignUp, isLoginReady, isSignUpOpen, supabase } from "@/lib/supabase";

// ============================================================
// AUTH SCREEN (stage 06 / 07 → signup round)
// Two modes on one card:
//   sign in  → email + password against the Supabase account
//   sign up  → creates an account, but only for addresses
//              allowed in .env.local (VITE_SIGNUP_ALLOWED_*)
// Wrong password → inline retry; fifth wrong try → 3s backoff.
// ============================================================

type Mode = "signin" | "signup";

const PASSWORD_MIN = 6; // Supabase's minimum password length.

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const switchMode = (next: Mode) => {
    if (busy) return;
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setShowPassword(false);
  };

  const onSignIn = async () => {
    const { error: signInError } = await supabase!.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

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
        setError("Wrong email or password — try again.");
      }
      return;
    }

    setSignedIn(true);
  };

  const onSignUp = async () => {
    if (!canSignUp(email)) {
      setError("This address isn't allowed to create an account.");
      return;
    }

    const { data, error: signUpError } = await supabase!.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      console.error("[admin] sign-up failed:", signUpError.message);

      if (/already registered|already been registered/i.test(signUpError.message)) {
        setError("An account with this email already exists — sign in instead.");
      } else if (/password/i.test(signUpError.message)) {
        setError(`Password is too weak — use at least ${PASSWORD_MIN} characters.`);
      } else if (/rate|too many/i.test(signUpError.message)) {
        setError("Too many attempts — wait a moment and try again.");
      } else {
        setError("Couldn't create the account — try again in a moment.");
      }
      return;
    }

    // Session returned → email confirmation is off, we're in.
    if (data.session) {
      setSignedIn(true);
      return;
    }

    // Confirmation email on → send them to their inbox first.
    setNotice(
      "Account created. Check your email to confirm your address, then sign in."
    );
    setPassword("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !isLoginReady || busy || lockedSeconds > 0) return;
    if (mode === "signup" && password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signin") await onSignIn();
    else await onSignUp();

    setBusy(false);
  };

  const isSubmitDisabled =
    !isLoginReady ||
    busy ||
    lockedSeconds > 0 ||
    password.length === 0 ||
    email.trim().length === 0 ||
    (mode === "signup" && password.length < PASSWORD_MIN);

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
        <h1 className="mt-1 text-center font-serif-display text-2xl">
          {mode === "signin" ? "Admin" : "Create account"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "signin"
            ? "Enter your email and password to continue."
            : "Register with an approved email address."}
        </p>

        {!isLoginReady && (
          <div className="mt-5 flex gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-600">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Supabase isn't connected yet — copy <span className="font-mono">.env.example</span>{" "}
              to <span className="font-mono">.env.local</span> and fill in{" "}
              <span className="font-mono">VITE_SUPABASE_URL</span> and{" "}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>, then restart the
              app.
            </span>
          </div>
        )}

        <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!isLoginReady || lockedSeconds > 0}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!isLoginReady || lockedSeconds > 0}
                className="pr-10"
                placeholder={
                  lockedSeconds > 0
                    ? `Wait ${lockedSeconds}s…`
                    : mode === "signup"
                      ? `At least ${PASSWORD_MIN} characters`
                      : "••••••••"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={!isLoginReady || lockedSeconds > 0}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden />
                ) : (
                  <Eye size={16} aria-hidden />
                )}
              </button>
            </div>
            {mode === "signup" && (
              <p className="text-[11px] text-muted-foreground">
                Minimum {PASSWORD_MIN} characters.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={isSubmitDisabled}
          >
            {mode === "signin" ? <KeyRound size={15} /> : <UserPlus size={15} />}
            {busy
              ? mode === "signin"
                ? "Checking…"
                : "Creating…"
              : mode === "signin"
                ? "Enter"
                : "Create account"}
          </Button>
        </form>

        {mode === "signup" && !isSignUpOpen && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-600">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Registration is closed — set{" "}
              <span className="font-mono">VITE_SIGNUP_ALLOWED_DOMAIN</span> or{" "}
              <span className="font-mono">VITE_SIGNUP_ALLOWED_EMAILS</span> in{" "}
              <span className="font-mono">.env.local</span> and restart the app.
            </span>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account yet?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                disabled={!isLoginReady}
                className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                disabled={!isLoginReady}
                className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          O Studio Innovations · internal
        </p>
      </div>
    </div>
  );
}
