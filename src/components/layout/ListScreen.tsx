import { type ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { asExternalHref } from "@/lib/format";
import { getStatusMeta } from "@/lib/statusMeta";
import { cn } from "@/lib/utils";

// ============================================================
// LIST SHELL (stage 12) — the shared furniture of the three
// inbox screens: heading + search, status filter pills, and the
// honest states (loading / empty / error) every list must have
// (stage 07). Detail helpers live here too so all three detail
// sheets render identically.
// ============================================================

interface ListFilter {
  status: string;
  label: string;
  count: number;
}

interface ListScreenProps {
  overline: string;
  title: string;
  description: string;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  filters: ListFilter[];
  active: string;
  onActive: (status: string) => void;
  children: ReactNode;
}

export function ListScreen({
  overline,
  title,
  description,
  search,
  onSearch,
  searchPlaceholder,
  filters,
  active,
  onActive,
  children,
}: ListScreenProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs tracking-widest-plus uppercase text-primary">
            {overline}
          </p>
          <h1 className="font-serif-display text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = active === filter.status;
          const meta = filter.status === "all" ? null : getStatusMeta(filter.status);
          return (
            <button
              key={filter.status}
              type="button"
              onClick={() => onActive(filter.status)}
              aria-pressed={isActive}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : meta
                    ? cn("hover:opacity-80", meta.className)
                    : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label} <span className="opacity-70">{filter.count}</span>
            </button>
          );
        })}
      </div>

      {children}
    </div>
  );
}

// --- Honest states (stage 07) -------------------------------

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 rounded-full"
        onClick={onRetry}
      >
        <RefreshCw size={14} /> Try again
      </Button>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <p className="font-serif-display text-lg">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_row, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

// --- Detail helpers (all three sheets share these) ----------

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-3 text-xs tracking-widest-plus uppercase text-primary">{title}</p>
      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

export function DetailField({
  label,
  value,
  items,
  link,
}: {
  label: string;
  value?: string | null;
  items?: string[];
  link?: boolean;
}) {
  let body: ReactNode;

  if (items && items.length > 0) {
    body = (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-normal text-foreground/90"
          >
            {item}
          </span>
        ))}
      </div>
    );
  } else if (value === undefined || value === null || value === "") {
    body = <span className="text-muted-foreground">—</span>;
  } else if (link) {
    const href = asExternalHref(value);
    body = href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm text-primary hover:underline"
      >
        {value}
      </a>
    ) : (
      <span className="text-sm">{value}</span>
    );
  } else {
    body = <span className="whitespace-pre-line text-sm leading-relaxed">{value}</span>;
  }

  return (
    <div>
      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{body}</dd>
    </div>
  );
}
