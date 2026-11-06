// ============================================================
// FORMATTING (stage 07 — Lagos time, tappable contacts)
// ============================================================

const dateTimeFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

const dayFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

/** "24 Oct 2026, 9:20 am" — always shown in Lagos time (WAT). */
export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFmt.format(date);
};

/** "24 Oct 2026" — for plain date columns and date-only values. */
export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dayFmt.format(date);
};

/** tappable phone link (stage 06: tel:/mailto: on every contact). */
export const telHref = (phone: string): string =>
  `tel:${phone.replace(/[^\d+]/g, "")}`;

export const mailHref = (email: string): string => `mailto:${email}`;

/** Heuristic for turning work-sample text into a safe link. */
export const asExternalHref = (value: string): string | null =>
  /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
