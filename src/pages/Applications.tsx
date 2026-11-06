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
import { useApplications, useUpdateStatus } from "@/lib/queries";
import {
  applicationStatusList,
  getStatusMeta,
} from "@/lib/statusMeta";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================================
// APPLICATIONS (stage 13 B6 — the priority screen)
// List → search/filter → open the full 20 answers in the
// form's own 6 sections → move the applicant through the
// pipeline (optimistic, persisted to Supabase).
// ============================================================

type StatusFilter = "all" | ApplicationStatus;

export default function Applications() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const applications = useApplications();
  const updateStatus = useUpdateStatus();

  const rows = applications.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query) return true;
      return [
        row.fullName,
        row.location,
        row.email,
        row.interests.join(" "),
        row.experience,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search, filter]);

  const filters = useMemo(
    () => [
      { status: "all", label: "All", count: rows.length },
      ...applicationStatusList.map((status) => ({
        status: status as string,
        label: getStatusMeta(status).label,
        count: rows.filter((row) => row.status === status).length,
      })),
    ],
    [rows]
  );

  const open = rows.find((row) => row.id === openId) ?? null;

  const body = applications.isPending ? (
    <ListSkeleton rows={5} />
  ) : applications.isError ? (
    <ErrorPanel
      message={
        applications.error instanceof Error
          ? applications.error.message
          : "Couldn't load applications."
      }
      onRetry={() => void applications.refetch()}
    />
  ) : rows.length === 0 ? (
    <EmptyState
      title="No applications yet"
      hint="Expected once the /careers form is connected — see stages/13, Phase A."
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
              <TableHead>Applicant</TableHead>
              <TableHead className="hidden lg:table-cell">Based in</TableHead>
              <TableHead className="hidden lg:table-cell">Interested in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Applied</TableHead>
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
                  <p className="font-medium">{row.fullName}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {row.location}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {row.interests[0] ?? "—"}
                  {row.interests.length > 1 && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      +{row.interests.length - 1}
                    </span>
                  )}
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
                <p className="truncate text-sm font-medium">{row.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.location}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {row.interests[0] ?? "—"}
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
        overline="People — Phase 1"
        title="Career Applications"
        description="Every applicant, their full response, and where they are in the pipeline."
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, location, interest…"
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
                  {open.fullName}
                </SheetTitle>
                <SheetDescription>
                  {open.location} · Applied {formatDateTime(open.createdAt)}
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

              {/* Status control */}
              <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
                <p className="mb-2 text-xs text-muted-foreground">Pipeline status</p>
                <Select
                  value={open.status}
                  disabled={updateStatus.isPending}
                  onValueChange={(value) =>
                    updateStatus.mutate({
                      table: "creator_applications",
                      id: open.id,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full sm:w-56" aria-label="Pipeline status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationStatusList.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusMeta(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6 space-y-4">
                <DetailSection title="1 · Personal information">
                  <DetailField label="2. Phone / WhatsApp" value={open.phone} />
                  <DetailField label="3. Email" value={open.email} />
                  <DetailField label="4. Based in" value={open.location} />
                </DetailSection>

                <DetailSection title="2 · Creative interests">
                  <DetailField label="5. Interested in" items={open.interests} />
                  <DetailField label="6. Experience" value={open.experience} />
                  <DetailField label="7. Tools / equipment" items={open.equipment} />
                </DetailSection>

                <DetailSection title="3 · Creative portfolio">
                  <DetailField label="8. Content experience" value={open.createdBefore} />
                  <DetailField
                    label="9. Work sample"
                    value={open.workSamples}
                    link
                  />
                  <DetailField label="10. Short video idea" value={open.videoIdea} />
                  <DetailField
                    label="11. What makes content interesting"
                    value={open.audienceInterest}
                  />
                  <DetailField
                    label="12. Good idea with limited resources"
                    value={open.resourcefulness}
                  />
                </DetailSection>

                <DetailSection title="4 · Collaboration & availability">
                  <DetailField
                    label="13. Preferred collaboration"
                    value={open.collaboration}
                  />
                  <DetailField
                    label="14. Available around Gbagada Phase 1"
                    value={open.localAvailability}
                  />
                  <DetailField label="15. Schedule" value={open.schedule} />
                  <DetailField
                    label="16. Why O Studio Innovations"
                    value={open.motivation}
                  />
                </DetailSection>

                <DetailSection title="5 · Creative challenge">
                  <DetailField
                    label="17. One attention-grabbing video"
                    value={open.creativeChallenge}
                  />
                  <DetailField label="18. Practical task" value={open.practicalTask} />
                </DetailSection>

                <DetailSection title="6 · Final confirmation">
                  <DetailField
                    label="19a. Information accurate to the best of knowledge"
                    value={open.confirmedAccuracy ? "Yes — confirmed" : "Not confirmed"}
                  />
                  <DetailField
                    label="19b. Work samples own or permissioned"
                    value={open.confirmedOwnership ? "Yes — confirmed" : "Not confirmed"}
                  />
                  <DetailField label="20. Anything else" value={open.finalNotes} />
                </DetailSection>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
