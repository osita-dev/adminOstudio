import { type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// COUNT CARD (stage 06 — dashboard's three numbers)
// value === null means "still loading" → skeleton, never blank.
// ============================================================

interface CountCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
}

export function CountCard({ label, value, icon: Icon }: CountCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] tracking-widest-plus uppercase text-muted-foreground">
          {label}
        </p>
        <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Icon size={15} strokeWidth={1.75} />
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-3 h-9 w-16" />
      ) : (
        <p className="font-serif-display mt-3 text-3xl">{value}</p>
      )}
    </div>
  );
}
