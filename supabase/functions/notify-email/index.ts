// ============================================================
// NOTIFY EMAIL (Phase F2) — Supabase Edge Function
//
// Invoked by Supabase Database Webhooks on INSERT into the
// three public forms' tables and sends one email per
// submission through Resend, to ADMIN_EMAIL.
//
// The public website never talks to this function — all
// notification logic lives on the admin/Supabase side of the
// split (the site only ever INSERTs rows).
//
// Setup (one time):
//   1. supabase functions deploy notify-email --no-verify-jwt
//   2. supabase secrets set RESEND_API_KEY=re_... ADMIN_EMAIL=you@example.com
//   3. Dashboard -> Database -> Webhooks -> create one webhook
//      per table (creator_applications, project_inquiries,
//      studio_bookings), event INSERT, "Invoke a function":
//      notify-email
//
// Payload: handles both webhook body shapes (records[] array
// from current Supabase, and the legacy single `record`).
// ============================================================

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Untouched by a verified Resend domain. Once you verify your
// own domain in Resend, swap this for e.g. "O Studio <alerts@ostudioinnovations.com>".
const FROM = "O Studio Website <onboarding@resend.dev>";

interface WebhookPayload {
  type?: string;
  table?: string;
  records?: Array<Record<string, unknown>>;
  record?: Record<string, unknown>;
}

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

interface EmailCopy {
  subject: string;
  text: string;
}

const describe = (table: string, row: Record<string, unknown>): EmailCopy => {
  const name = asText(row.name) || asText(row.full_name) || "Someone";
  const contact = [`Name:  ${name}`, `Email: ${asText(row.email)}`, `Phone: ${asText(row.phone)}`];

  if (table === "creator_applications") {
    const interests = Array.isArray(row.interests) ? row.interests.join(", ") : "";
    return {
      subject: `[O Studio] New application - ${name}`,
      text: [
        "NEW CREATOR APPLICATION",
        "",
        ...contact,
        `Location: ${asText(row.location)}`,
        interests ? `Interests: ${interests}` : "",
        `Experience: ${asText(row.experience)}`,
        "",
        "Open the admin dashboard -> Applications to review it.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (table === "project_inquiries") {
    const extra = asText(row.additional_requirements);
    return {
      subject: `[O Studio] New brief - ${name}`,
      text: [
        "NEW PROJECT BRIEF",
        "",
        ...contact,
        `Service: ${asText(row.service)}`,
        `Type:    ${asText(row.project_type)}`,
        `Budget:  ${asText(row.budget_range)}`,
        `Event:   ${asText(row.event_date) || "-"}`,
        `Location: ${asText(row.location) || "-"}`,
        "",
        "Brief:",
        asText(row.description),
        extra ? "" : "",
        extra ? `Extra requirements: ${extra}` : "",
        "",
        "Open the admin dashboard -> Inquiries to respond.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  // studio_bookings
  const notes = asText(row.notes);
  return {
    subject: `[O Studio] New booking - ${name}`,
    text: [
      "NEW STUDIO BOOKING REQUEST",
      "",
      ...contact,
      `Studio:  ${asText(row.studio)}`,
      `When:    ${asText(row.booking_date)} ${asText(row.booking_time)}`,
      `Purpose: ${asText(row.purpose)}`,
      notes ? `Notes:   ${notes}` : "",
      "",
      "Open the admin dashboard -> Bookings to confirm or decline.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request): Promise<Response> => {
  // Only calls signed by Supabase's own webhook (service key) pass.
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${SERVICE_KEY}`) {
    // Prefix only — never the full key — so a 401 in the logs is diagnosable.
    console.error("[notify-email] rejected call, auth prefix:", auth.slice(0, 24));
    return json({ error: "unauthorized" }, 401);
  }

  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    return json({ error: "RESEND_API_KEY / ADMIN_EMAIL secrets are not set" }, 500);
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return json({ error: "unreadable payload" }, 400);
  }

  const table = payload.table ?? "";
  const rows: Array<Record<string, unknown>> =
    payload.records ?? (payload.record ? [payload.record] : []);
  if (!table || rows.length === 0) return json({ ok: true, skipped: "no records" });

  const sent: string[] = [];
  for (const row of rows) {
    const { subject, text } = describe(table, row);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [ADMIN_EMAIL], subject, text }),
    });
    if (res.ok) {
      sent.push(subject);
    } else {
      console.error("[notify-email] resend failed", res.status, await res.text());
    }
  }

  return json({ ok: true, sent });
});
