import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "./AdminShell";

// ============================================================
// AUTH GUARD (stage 07 — no data view without a session)
// Layout route: loading → splash · signed out → /login ·
// signed in → AdminShell + page. Belt-and-braces: RLS refuses
// reads without this session anyway.
// ============================================================

type AuthState = "loading" | "signedIn" | "signedOut";

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-content-center bg-hero-gradient text-center">
      <img
        src="/OstudioInnovation.svg"
        alt="O Studio Innovations"
        className="mx-auto h-14 w-auto object-contain"
      />
      <p className="mt-4 text-xs tracking-widest-plus uppercase text-muted-foreground">
        Loading…
      </p>
    </div>
  );
}

export function AuthGuard() {
  const [state, setState] = useState<AuthState>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      setState("signedOut");
      return;
    }
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session);
        setState(data.session ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (alive) setState("signedOut");
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!alive) return;
        setSession(nextSession);
        setState(nextSession ? "signedIn" : "signedOut");
      }
    );

    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") return <LoadingScreen />;
  if (state === "signedOut") return <Navigate to="/login" replace />;

  return (
    <AdminShell sessionEmail={session?.user.email ?? ""}>
      <Outlet />
    </AdminShell>
  );
}

/** Also used by the login page's own guard. */
export function RequireSignedOut({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    if (!supabase) {
      setState("signedOut");
      return;
    }
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setState(data.session ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (alive) setState("signedOut");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state === "loading") return null;
  if (state === "signedIn") return <Navigate to="/" replace />;
  return <>{children}</>;
}
