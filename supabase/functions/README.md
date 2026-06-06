# Supabase Edge Functions

## Runtime boundary

These functions run on **Supabase's Deno Deploy infrastructure**, not inside the Astro SSR Node.js process. They are a completely separate runtime from the web application in `src/`.

```
┌─────────────────────────────────────────┐   ┌──────────────────────────────────────┐
│  Astro SSR  (Node.js / @astrojs/node)   │   │  Supabase Edge Functions  (Deno)     │
│                                         │   │                                      │
│  src/lib/supabaseClient.ts              │   │  functions/process-scheduled-emails/ │
│  src/lib/supabaseAdminClient.ts         │   │  functions/send-vendor-email/        │
│  src/lib/supabaseServer.ts              │   │                                      │
│                                         │   │  Deployed via: supabase functions    │
│  Memory managed by: Node.js process     │   │  Memory managed by: Deno isolate     │
└─────────────────────────────────────────┘   └──────────────────────────────────────┘
```

**Any memory or instantiation concern in these functions is scoped to the Deno isolate, not the Astro SSR server.** Fixes to Node.js SSR memory (e.g. Supabase client singletons in `src/lib/`) have no effect here, and vice versa.

---

## Functions

### `process-scheduled-emails`

Cron-triggered function (via `pg_cron`) that claims a batch of due rows from `vendor_emails`, delegates sending to `send-vendor-email`, and updates the row status.

- Trigger: Supabase scheduled job (cron)
- Auth: service role key (full DB access, no RLS)
- Configurable secrets: `MAX_ATTEMPTS`, `BATCH_SIZE`, `PROCESSING_TIMEOUT_MINUTES`

### `send-vendor-email`

HTTP POST function that sends a transactional email via Resend and optionally writes an audit row to `vendor_emails`.

- Trigger: HTTP POST (called by `process-scheduled-emails` or directly from admin)
- Auth: service role key
- Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`

---

## Supabase client pattern

Both functions use a **module-level singleton** for the Supabase client:

```typescript
// Created once per cold start — reused across warm Deno isolate invocations.
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  // supabase is shared here — no new client per request
});
```

This is specific to Deno Deploy's warm-isolate model and is unrelated to the Node.js SSR singleton pattern in `src/lib/`.

---

## Deployment

```bash
# Deploy a single function
supabase functions deploy process-scheduled-emails
supabase functions deploy send-vendor-email

# Set secrets (once per project)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set RESEND_API_KEY=...
```
