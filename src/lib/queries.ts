import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { notConfiguredError, supabase } from "./supabase";
import {
  mapApplication,
  mapBooking,
  mapInquiry,
  type CreatorApplication,
  type CreatorApplicationRow,
  type ProjectInquiry,
  type ProjectInquiryRow,
  type StudioBooking,
  type StudioBookingRow,
  type TableName,
} from "./types";

// ============================================================
// DATA ACCESS (stage 07 / 09 — fetch & write paths)
//
// Every screen reads through these hooks; nothing calls
// supabase directly from a component. Failures are logged for
// debugging but surfaced as plain-English messages only
// (stage 07: never a raw database error).
// ============================================================

export const queryKeys = {
  applications: ["applications"] as const,
  inquiries: ["inquiries"] as const,
  bookings: ["bookings"] as const,
  counts: ["counts"] as const,
  latest: ["latest"] as const,
};

const loadError = (what: string, detail: unknown): Error => {
  console.error(`[admin] failed to load ${what}`, detail);
  return new Error(`Couldn't load ${what} — check your connection and retry.`);
};

// --- Lists --------------------------------------------------

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: async (): Promise<CreatorApplication[]> => {
      if (!supabase) throw notConfiguredError();
      const { data, error } = await supabase
        .from("creator_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw loadError("applications", error);
      return ((data ?? []) as CreatorApplicationRow[]).map(mapApplication);
    },
  });
}

export function useInquiries() {
  return useQuery({
    queryKey: queryKeys.inquiries,
    queryFn: async (): Promise<ProjectInquiry[]> => {
      if (!supabase) throw notConfiguredError();
      const { data, error } = await supabase
        .from("project_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw loadError("project briefs", error);
      return ((data ?? []) as ProjectInquiryRow[]).map(mapInquiry);
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: async (): Promise<StudioBooking[]> => {
      if (!supabase) throw notConfiguredError();
      const { data, error } = await supabase
        .from("studio_bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw loadError("bookings", error);
      return ((data ?? []) as StudioBookingRow[]).map(mapBooking);
    },
  });
}

// --- Dashboard counts (stage 06: three numbers only) --------

export interface DashboardCounts {
  newApplications: number;
  openBriefs: number;
  pendingBookings: number;
}

export function useCounts() {
  return useQuery({
    queryKey: queryKeys.counts,
    queryFn: async (): Promise<DashboardCounts> => {
      if (!supabase) throw notConfiguredError();
      const [apps, briefs, bookings] = await Promise.all([
        supabase
          .from("creator_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
        supabase
          .from("project_inquiries")
          .select("id", { count: "exact", head: true })
          .in("status", ["new", "contacted"]),
        supabase
          .from("studio_bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      const error = apps.error ?? briefs.error ?? bookings.error;
      if (error) throw loadError("the dashboard counts", error);
      return {
        newApplications: apps.count ?? 0,
        openBriefs: briefs.count ?? 0,
        pendingBookings: bookings.count ?? 0,
      };
    },
  });
}

// --- Latest activity (merged across the three tables) -------

export interface LatestItem {
  id: string;
  kind: "Application" | "Brief" | "Booking";
  title: string;
  meta: string;
  status: string;
  createdAt: string;
  to: string;
}

export function useLatestItems() {
  return useQuery({
    queryKey: queryKeys.latest,
    queryFn: async (): Promise<LatestItem[]> => {
      if (!supabase) throw notConfiguredError();
      const [apps, briefs, bookings] = await Promise.all([
        supabase
          .from("creator_applications")
          .select("id, created_at, full_name, location, status")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("project_inquiries")
          .select("id, created_at, name, service, status")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("studio_bookings")
          .select("id, created_at, name, studio, status")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      const error = apps.error ?? briefs.error ?? bookings.error;
      if (error) throw loadError("latest activity", error);

      const items: LatestItem[] = [
        ...(apps.data ?? []).map((row) => ({
          id: row.id as string,
          kind: "Application" as const,
          title: row.full_name as string,
          meta: row.location as string,
          status: row.status as string,
          createdAt: row.created_at as string,
          to: "/applications",
        })),
        ...(briefs.data ?? []).map((row) => ({
          id: row.id as string,
          kind: "Brief" as const,
          title: row.name as string,
          meta: row.service as string,
          status: row.status as string,
          createdAt: row.created_at as string,
          to: "/inquiries",
        })),
        ...(bookings.data ?? []).map((row) => ({
          id: row.id as string,
          kind: "Booking" as const,
          title: row.name as string,
          meta: row.studio as string,
          status: row.status as string,
          createdAt: row.created_at as string,
          to: "/bookings",
        })),
      ];

      return items
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6);
    },
  });
}

// --- Status updates (stage 07: optimistic + rollback) -------

const listKeyFor = (table: TableName): readonly string[] => {
  if (table === "creator_applications") return queryKeys.applications;
  if (table === "project_inquiries") return queryKeys.inquiries;
  return queryKeys.bookings;
};

const ALL_LIST_KEYS: readonly (readonly string[])[] = [
  queryKeys.applications,
  queryKeys.inquiries,
  queryKeys.bookings,
  queryKeys.counts,
  queryKeys.latest,
];

const invalidateAll = (client: QueryClient): void => {
  void client.invalidateQueries();
};

export interface StatusChange {
  table: TableName;
  id: string;
  status: string;
}

export function useUpdateStatus() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ table, id, status }: StatusChange): Promise<void> => {
      if (!supabase) throw notConfiguredError();
      const { error } = await supabase.from(table).update({ status }).eq("id", id);
      if (error) {
        console.error("[admin] status update failed", error);
        throw new Error("Couldn't save that change — check your connection and retry.");
      }
    },

    onMutate: async ({ table, id, status }: StatusChange) => {
      const key = listKeyFor(table);
      for (const k of ALL_LIST_KEYS) void client.cancelQueries({ queryKey: k });
      const previous = client.getQueryData(key);
      client.setQueryData(key, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return (old as Array<{ id: string; status: string }>).map((row) =>
          row.id === id ? { ...row, status } : row
        );
      });
      return { key, previous };
    },

    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        client.setQueryData(context.key, context.previous);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't save that change — check your connection and retry."
      );
    },

    onSettled: () => {
      invalidateAll(client);
    },
  });
}
