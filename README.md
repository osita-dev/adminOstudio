# O Studio Admin

Internal dashboard for **O Studio Innovations** — career applications, project
briefs, and studio bookings pulled live from Supabase, with a single password
login. Built to be the whole admin so nobody opens Supabase's raw table viewer.

Design, typography, and colors are identical to the public site (tokens copied
from `ostudioinnovations/src/index.css`).

---

## Run it (VS Code / local)

```bash
bun install            # or: npm install
cp .env.example .env.local    # Windows: copy .env.example .env.local
# edit .env.local → 3 values (below)
bun run dev            # or: npm run dev
```

`.env.local` needs:

| Key | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `VITE_ADMIN_EMAIL` | The single admin email you create in Phase A |

Missing keys don't crash anything — the login screen shows a plain-English
"Supabase isn't connected" notice instead.

## First-time database setup (Stage 13, Phase A)

1. Create a free Supabase project (region: **Ireland / eu-west-1**).
2. SQL Editor → paste **`supabase/setup.sql`** → Run (tables + RLS).
3. Authentication → Users → **add one user** (your admin email + a strong
   password). This is the account the password login signs in as.
4. Authentication → Sign In / Providers → Email → **turn OFF
   "Allow new users to sign up"**.
5. Fill `.env.local`, restart `bun run dev`, log in with the password.
6. SQL Editor → paste **`supabase/seed.sql`** → Run → check every status chip,
   filter, and detail sheet (Gate 2).

## What's inside

```
supabase/           setup.sql (tables+RLS) · seed.sql (test rows)
src/lib/            supabase client · types+mappers · queries (react-query)
                    status chips · date/contact formatting
src/components/     AuthGuard · AdminShell (sidebar/drawer) · CountCard
                    ListScreen (search+pills+states+detail helpers)
src/pages/          Login · Dashboard · Applications · Inquiries · Bookings
stages/             the full 01–16 process docs this app was built from
```

## Notifications (Phase F)

Two channels are built in; **WhatsApp waits on Meta verification** (Phase E).

**1. Live browser alerts (admin)** — popup + chime + instant list/count
refresh while the dashboard is open:

- Run `supabase/realtime.sql` in the SQL editor (idempotent, safe to re-run).
- Open the dashboard → **Enable live alerts** in the sidebar → Allow.

**2. E-mail per submission (always-on)** — Supabase database webhook →
edge function `supabase/functions/notify-email` → Resend → your inbox:

```bash
npm install -g supabase   # one-time CLI install (bun install -g supabase also works)
supabase login
supabase link --project-ref dohhbxsfhfmtizluygxh
supabase secrets set RESEND_API_KEY=re_your_key ADMIN_EMAIL=admin@ostudioinnovations.com
supabase functions deploy notify-email --no-verify-jwt
```

- Dashboard → **Database → Webhooks** → create three webhooks (one per
  table: `creator_applications`, `project_inquiries`, `studio_bookings`),
  event **INSERT**, type **Invoke a function** → `notify-email`.
- Create the webhooks **after** `seed.sql` — seed rows fire one email each.
- Until a domain is verified in Resend, mail is sent from
  `onboarding@resend.dev` and can only reach the address of the Resend
  account itself — set `ADMIN_EMAIL` accordingly, or verify a domain.

## Commands

```bash
bun run dev        # dev server
bun run build      # tsc -b && vite build  (type-check + production build)
bun run lint       # eslint
```

## Deploy

`vercel.json` already rewrites all routes to `index.html`. Point Vercel (or any
static host) at this folder, set the three env vars in the dashboard, build
command `bun run build`, output `dist`. Host it on
`admin.ostudioinnovations.com` — it is deliberately unlinked from the public
site and carries `noindex` + `robots.txt` disallow.

## Not in V1 (stage 13 Phase E / stage 16)

CSV export, the Client Journal module, and user
roles are deliberately deferred — see `stages/16-ITERATE.md`.
