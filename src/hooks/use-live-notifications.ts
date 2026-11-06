import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ============================================================
// LIVE ALERTS (Phase F1 — in-browser notifications)
//
// The admin subscribes, through Supabase Realtime, to INSERTs
// on the three public forms' tables. The moment the site (or
// any client) inserts a row, the admin gets a browser popup +
// a toast + a short chime, and every count/list on the open
// screen refreshes itself. The public website is untouched —
// all notification logic lives on this side, per the split.
//
// Requires: the three tables in the `supabase_realtime`
// publication (run supabase/realtime.sql once).
// ============================================================

export type AlertPermission = NotificationPermission | "unsupported";

type AlertTable = "creator_applications" | "project_inquiries" | "studio_bookings";

interface AlertCopy {
  title: string;
  body: string;
}

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

const describe = (table: AlertTable, row: Record<string, unknown>): AlertCopy => {
  const name = asText(row.name) || asText(row.full_name) || "Someone";

  if (table === "creator_applications") {
    const location = asText(row.location);
    return {
      title: "New creator application",
      body: `${name}${location ? ` (${location})` : ""} applied — open Applications to review.`,
    };
  }

  if (table === "project_inquiries") {
    const service = asText(row.service);
    return {
      title: "New project brief",
      body: `${name}${service ? ` — ${service}` : ""} — open Inquiries to respond.`,
    };
  }

  const studio = asText(row.studio);
  const date = asText(row.booking_date);
  return {
    title: "New studio booking",
    body: `${name} — ${studio || "studio"}${date ? `, ${date}` : ""} — open Bookings to confirm.`,
  };
};

// Short chime so a backgrounded tab still catches the ear.
// Best-effort: any failure is silent, the alerts still fire.
let audio: AudioContext | null = null;

const primeAlertSound = (): void => {
  try {
    if (audio === null) audio = new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    /* sound is a nice-to-have */
  }
};

const beep = (): void => {
  try {
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.55);
  } catch {
    /* best-effort */
  }
};

export function useLiveAlerts(): { permission: AlertPermission; enable: () => void } {
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<AlertPermission>(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  const enable = useCallback(() => {
    if (typeof Notification === "undefined") return;
    // Called from a click, so the browser will show its prompt
    // and the audio context is allowed to make sound later.
    primeAlertSound();
    void Notification.requestPermission().then((next) => setPermission(next));
  }, []);

  useEffect(() => {
    if (!supabase || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const handle = (table: AlertTable, record: unknown): void => {
      const row: Record<string, unknown> =
        typeof record === "object" && record !== null ? (record as Record<string, unknown>) : {};
      const { title, body } = describe(table, row);
      try {
        const popup = new Notification(title, { body, tag: `ostudio-${table}` });
        popup.onclick = () => window.focus();
      } catch {
        /* some platforms block the popup — the toast still fires */
      }
      beep();
      toast.info(title, { description: body });
      // Refresh counts, latest activity and the open list.
      void queryClient.invalidateQueries();
    };

    const channel = supabase
      .channel("admin-live-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "creator_applications" },
        (payload) => handle("creator_applications", payload.new)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_inquiries" },
        (payload) => handle("project_inquiries", payload.new)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "studio_bookings" },
        (payload) => handle("studio_bookings", payload.new)
      )
      .subscribe();

    return () => {
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { permission, enable };
}
