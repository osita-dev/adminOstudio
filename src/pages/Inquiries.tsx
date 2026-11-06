import { useMemo, useState } from "react";
import { ChevronRight, Mail, Phone } from "lucide-react";
import {
  DetailField,
  DetailSection,
  EmptyState,
  ErrorPanel,
  ListScreen,
  ListSkeleton,
} from "@/components/layout/ListScreen";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, mailHref, telHref } from "@/lib/format";
import { useInquiries, useUpdateStatus } from "@/lib/queries";
import { getStatusMeta, inquiryStatusList } from "@/lib/statusMeta";
import type { InquiryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================================
// INQUIRIES (stage 13 B7) — briefs from Start a Project:
// list → open the full brief → move New → Contacted →
// Booked/Closed. Same shell as Applications.
// ============================================================

type StatusFilter = "all" | InquiryStatus;

export default function Inquiries() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const inquiries = useInquiries();
  const updateStatus = useUpdateStatus();

  const rows = inquiries.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query) return true;
      return [
        row.name,
        row.service,
        row.projectType,
        row.budgetRange,
        row.description,
        row.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search, filter]);

  const filters = useMemo(
    () => [
      { status: "all", label: "All", count: rows.length },
      ...inquiryStatusList.map((status) => ({
        status: status as string,
        label: getStatusMeta(status).label,
        count: rows.filter((row) => row.status === status).length,
      })),
    ],
    [rows]
  );

  const open = rows.find((row) => row.id === openId) ?? null;

  const body = inquiries.isPending ? (
    <ListSkeleton rows={4} />
  ) : inquiries.isError ? (
    <ErrorPanel
      message={
        inquiries.error instanceof Error
          ? inquiries.error.message
          : "Couldn't load project briefs."
      }
      onRetry={() => void inquiries.refetch()}
    />
  ) : rows.length === 0 ? (
    <EmptyState
      title="No project briefs yet"
      hint="Briefs sent through Start a Project will appear here once the form saves to the database — see stages/13, Phase C."
    />
  ) : filtered.length === 0 ? (
    <EmptyState
      title="Nothing matches"
      hint="Try a different search term or status filter."
    />
  ) : (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              <TableHead className="hidden lg:table-cell">Service</TableHead>
              <TableHead className="hidden lg:table-cell">Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Sent</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setOpenId(row.id)}
                className="cursor-pointer"
              >
                <TableCell>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {row.service}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {row.budgetRange}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px]",
                      getStatusMeta(row.status).className
                    )}
                  >
                    {getStatusMeta(row.status).label}
                  </span>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatDateTime(row.createdAt)}
                </TableCell>
                <TableCell>
                  <ChevronRight size={15} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setOpenId(row.id)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.service}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {row.budgetRange}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={cn(
                    "inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px]",
                    getStatusMeta(row.status).className
                  )}
                >
                  {getStatusMeta(row.status).label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDateTime(row.createdAt)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <>
      <ListScreen
        overline="Money in — Phase 1"
        title="Project Inquiries"
        description="Briefs from Start a Project — read, respond, and move them to booked."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search client, service, budget…"
        filters={filters}
        active={filter}
        onActive={(status) => setFilter(status as StatusFilter)}
      >
        {body}
      </ListScreen>

      {/* Detail */}
      <Sheet open={open !== null} onOpenChange={(openNow) => !openNow && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {open && (
            <>
              <SheetHeader className="pr-8 text-left">
                <SheetTitle className="font-serif-display text-2xl">
                  {open.name}
                </SheetTitle>
                <SheetDescription>
                  {open.service} · Sent {formatDateTime(open.createdAt)}
                </SheetDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href={telHref(open.phone)}>
                      <Phone size={13} /> {open.phone}
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href={mailHref(open.email)}>
                      <Mail size={13} /> Email
                    </a>
                  </Button>
                </div>
              </SheetHeader>

              <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
                <p className="mb-2 text-xs text-muted-foreground">Brief status</p>
                <Select
                  value={open.status}
                  disabled={updateStatus.isPending}
                  onValueChange={(value) =>
                    updateStatus.mutate({
                      table: "project_inquiries",
                      id: open.id,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full sm:w-56" aria-label="Brief status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryStatusList.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusMeta(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 space-y-4">
                <DetailSection title="1 · The brief">
                  <DetailField label="Service" value={open.service} />
                  <DetailField label="Project type" value={open.projectType} />
                  <DetailField label="Budget range" value={open.budgetRange} />
                  <DetailField label="Event date" value={open.eventDate} />
                  <DetailField label="Location" value={open.location} />
                  <DetailField label="Expected guests" value={open.expectedGuests} />
                </DetailSection>

                <DetailSection title="2 · Description">
                  <DetailField label="Description" value={open.description} />
                  <DetailField
                    label="Additional requirements"
                    value={open.additionalRequirements}
                  />
                </DetailSection>

                <DetailSection title="3 · Contact">
                  <DetailField label="Name" value={open.name} />
                  <DetailField label="Phone / WhatsApp" value={open.phone} />
                  <DetailField label="Email" value={open.email} />
                </DetailSection>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
