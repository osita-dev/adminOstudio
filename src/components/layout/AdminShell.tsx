import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CalendarDays, Inbox, LayoutDashboard, LogOut, Menu, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useLiveAlerts } from "@/hooks/use-live-notifications";
import { cn } from "@/lib/utils";

// ============================================================
// ADMIN SHELL (stage 06 / 12) — sidebar on desktop, top bar +
// drawer on mobile, logout in both. Same logo and brand marks
// as the public site; the nav is the whole v1 scope.
// ============================================================

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/applications", label: "Applications", icon: Users, end: false },
  { to: "/inquiries", label: "Inquiries", icon: Inbox, end: false },
  { to: "/bookings", label: "Bookings", icon: CalendarDays, end: false },
];

const navClassName = ({ isActive }: { isActive: boolean }): string =>
  cn(
    "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
    isActive
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground"
  );

interface AdminShellProps {
  sessionEmail: string;
  children: ReactNode;
}

export function AdminShell({ sessionEmail, children }: AdminShellProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Phase F1 — browser popups + live refresh on new submissions.
  const alerts = useLiveAlerts();

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    queryClient.clear();
    if (error) {
      console.error("[admin] sign-out failed", error);
      toast.error("Couldn't sign out — close the tab to be safe.");
      return;
    }
    toast.success("Signed out.");
    navigate("/login", { replace: true });
  };

  const nav = (onNavigate?: () => void) =>
    NAV_ITEMS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={navClassName}
        onClick={onNavigate}
      >
        <item.icon size={16} strokeWidth={1.75} />
        <span>{item.label}</span>
      </NavLink>
    ));

  const footer = (
    <div className="border-t border-border px-4 py-4">
      <p className="truncate text-[11px] text-muted-foreground" title={sessionEmail}>
        Signed in as {sessionEmail || "admin"}
      </p>

      {alerts.permission === "default" && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2.5 w-full rounded-full"
          onClick={alerts.enable}
        >
          <Bell size={13} /> Enable live alerts
        </Button>
      )}
      {alerts.permission === "granted" && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Bell size={12} className="text-primary" /> Live alerts on
        </p>
      )}
      {alerts.permission === "denied" && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Browser alerts are blocked — allow notifications for this site in your browser settings.
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-2.5 w-full rounded-full"
        onClick={() => void handleLogout()}
      >
        <LogOut size={13} /> Logout
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card/40">
        <div className="border-b border-border px-5 py-5">
          <Link to="/" aria-label="O Studio Admin home">
            <img
              src="/OstudioInnovation.svg"
              alt="O Studio Innovations"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="mt-2 text-[10px] tracking-widest-plus uppercase text-primary">
            Admin Dashboard
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">{nav()}</nav>

        {footer}
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" aria-label="O Studio Admin home" className="flex items-center gap-2.5">
            <img
              src="/OstudioInnovation.svg"
              alt="O Studio Innovations"
              className="h-8 w-auto object-contain"
            />
            <span className="text-[10px] tracking-widest-plus uppercase text-primary">
              Admin
            </span>
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-3/4 flex-col p-0 sm:max-w-xs">
              <SheetHeader className="border-b border-border px-5 py-5 text-left">
                <img
                  src="/OstudioInnovation.svg"
                  alt="O Studio Innovations"
                  className="h-10 w-auto object-contain"
                />
                <SheetTitle className="pt-2 text-[11px] tracking-widest-plus uppercase text-primary">
                  Admin Dashboard
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1 space-y-1 px-3 py-5">
                {nav(() => setMenuOpen(false))}
              </nav>
              {footer}
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
