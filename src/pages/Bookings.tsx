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
import { formatDate, formatDateTime, mailHref, telHref } from "@/lib/format";
import { useBookings, useUpdateStatus } from "@/lib/queries";
import { bookingStatusList, getStatusMeta } from "@/lib/statusMeta";
import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================================
// BOOKINGS (stage 13 B8) — studio rental requests. Empty state
// stays honest until the site's booking form ships (Phase C3).
// ============================================================

type StatusFilter = "all" | BookingStatus;

export default function Bookings() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const bookings = useBookings();
  const updateStatus = useUpdateStatus();

  const rows = bookings.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query) return true;
      return [row.name, row.studio, row.purpose, row.email]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search, filter]);

  const filters = useMemo(
    () => [
      { status: "all", label: "All", count: rows.length },
      ...bookingStatusList.map((status) => ({
        status: status as string,
        label: getStatusMeta(status).label,
        count: rows.filter((row) => row.status === status).length,
      })),
    ],
    [rows]
  );

  const open = rows.find((row) => row.id === openId) ?? null;

  const body = bookings.isPending ? (
    <ListSkeleton rows={4} />
  ) : bookings.isError ? (
    <ErrorPanel
      message={
        bookings.error instanceof Error
          ? bookings.error.message
          : "Couldn't load bookings."
      }
      onRetry={() => void bookings.refetch()}
    />
  ) : rows.length === 0 ? (
    <EmptyState
      title="No booking requests yet"
      hint="Requests will appear here once the Studio Rental booking form is live — see stages/13, Phase C3."
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
              <TableHead>Guest</TableHead>
              <TableHead className="hidden lg:table-cell">Studio</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Requested</TableHead>
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
                  {row.studio}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatDate(row.bookingDate)}
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
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
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
                <p className="truncate text-xs text-muted-foreground">{row.studio}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {formatDate(row.bookingDate)} · {row.bookingTime}
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
        overline="Studio — Phase 1"
        title="Studio Bookings"
        description="Requests for the podcast room, content rooms, photo studio, and film set."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search guest, studio, purpose…"
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
                  {open.studio} · Requested {formatDateTime(open.createdAt)}
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
                <p className="mb-2 text-xs text-muted-foreground">Booking status</p>
                <Select
                  value={open.status}
                  disabled={updateStatus.isPending}
                  onValueChange={(value) =>
                    updateStatus.mutate({
                      table: "studio_bookings",
                      id: open.id,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full sm:w-56" aria-label="Booking status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingStatusList.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusMeta(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 space-y-4">
                <DetailSection title="1 · The booking">
                  <DetailField label="Studio" value={open.studio} />
                  <DetailField label="Date" value={formatDate(open.bookingDate)} />
                  <DetailField label="Time" value={open.bookingTime} />
                  <DetailField label="Purpose" value={open.purpose} />
                  <DetailField label="Notes" value={open.notes} />
                </DetailSection>

                <DetailSection title="2 · Contact">
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
