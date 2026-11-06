import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Inbox, Users } from "lucide-react";
import { CountCard } from "@/components/layout/CountCard";
import {
  EmptyState,
  ErrorPanel,
  ListSkeleton,
} from "@/components/layout/ListScreen";
import { formatDateTime } from "@/lib/format";
import { useCounts, useLatestItems } from "@/lib/queries";
import { getStatusMeta } from "@/lib/statusMeta";
import { cn } from "@/lib/utils";

// ============================================================
// DASHBOARD (stage 06) — three numbers + newest activity.
// Honest states everywhere: skeleton while loading, plain
// English on error with retry, an explained empty state.
// ============================================================

const errorCopy = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export default function Dashboard() {
  const counts = useCounts();
  const latest = useLatestItems();
  const items = latest.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs tracking-widest-plus uppercase text-primary">
          Overview
        </p>
        <h1 className="font-serif-display text-3xl">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          What O Studio receives — live from your database.
        </p>
      </div>

      {/* Three numbers only (stage 06: no vanity charts) */}
      {counts.isError ? (
        <ErrorPanel
          message={errorCopy(counts.error, "Couldn't load the dashboard counts.")}
          onRetry={() => void counts.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CountCard
            label="New applications"
            value={counts.data ? counts.data.newApplications : null}
            icon={Users}
          />
          <CountCard
            label="Open briefs"
            value={counts.data ? counts.data.openBriefs : null}
            icon={Inbox}
          />
          <CountCard
            label="Pending bookings"
            value={counts.data ? counts.data.pendingBookings : null}
            icon={CalendarDays}
          />
        </div>
      )}

      {/* Latest activity */}
      <div className="mt-8 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-serif-display text-lg">Latest activity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Newest first, across all three lists.
            </p>
          </div>
          <Link
            to="/applications"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Open lists <ArrowRight size={13} />
          </Link>
        </div>

        <div className="p-6">
          {latest.isPending ? (
            <ListSkeleton rows={3} />
          ) : latest.isError ? (
            <ErrorPanel
              message={errorCopy(latest.error, "Couldn't load latest activity.")}
              onRetry={() => void latest.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              hint="Items appear here as soon as the site's forms save to the database — see stages/13, Phase A."
            />
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const meta = getStatusMeta(item.status);
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      to={item.to}
                      className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-accent/30"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] tracking-widest-plus uppercase text-muted-foreground">
                          {item.kind}
                        </p>
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.meta}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px]",
                            meta.className
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
