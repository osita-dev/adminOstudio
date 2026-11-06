// ============================================================
// STATUS METADATA (stage 06 — chip colors)
//   new / pending = gold · reviewing / contacted = sky
//   shortlisted / booked / confirmed / completed = emerald
//   closed / declined = muted
// One definition used by filters, tables, cards and detail.
// ============================================================

export interface StatusMeta {
  label: string;
  className: string;
}

const gold = "border-primary/40 bg-primary/10 text-primary";
const sky = "border-sky-500/40 bg-sky-500/10 text-sky-500";
const emerald = "border-emerald-500/40 bg-emerald-500/10 text-emerald-500";
const muted = "border-border bg-secondary text-muted-foreground";

const statusMeta: Record<string, StatusMeta> = {
  // applications
  new: { label: "New", className: gold },
  reviewing: { label: "Reviewing", className: sky },
  shortlisted: { label: "Shortlisted", className: emerald },
  contacted: { label: "Contacted", className: sky },
  closed: { label: "Closed", className: muted },
  // inquiries
  booked: { label: "Booked", className: emerald },
  // bookings
  pending: { label: "Pending", className: gold },
  confirmed: { label: "Confirmed", className: emerald },
  declined: { label: "Declined", className: muted },
  completed: { label: "Completed", className: emerald },
};

export const getStatusMeta = (status: string): StatusMeta =>
  statusMeta[status] ?? { label: status, className: muted };

export const applicationStatusList = [
  "new",
  "reviewing",
  "shortlisted",
  "contacted",
  "closed",
] as const;

export const inquiryStatusList = ["new", "contacted", "booked", "closed"] as const;

export const bookingStatusList = [
  "pending",
  "confirmed",
  "declined",
  "completed",
] as const;

/** Small bordered pill used everywhere a status appears. */
export const chipClassName = (status: string): string =>
  `inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] ${getStatusMeta(status).className}`;
