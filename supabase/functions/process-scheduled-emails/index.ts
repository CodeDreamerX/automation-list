import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Helpers (also exported from ./helpers.ts for unit testing) ────────────────

/** Parse an env-var string as a base-10 integer, falling back when absent/invalid. */
function parseEnvInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** True when the already-incremented attempt count has reached the ceiling. */
function shouldMarkFailed(attempts: number, maxAttempts: number): boolean {
  return attempts >= maxAttempts;
}

// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── Configurable via Supabase edge-function secrets ──────────────────────
  // MAX_ATTEMPTS             — how many send attempts before a row is dead-lettered (default 3)
  // BATCH_SIZE               — rows claimed per cron tick (default 50)
  // PROCESSING_TIMEOUT_MINUTES — rows stuck in 'processing' longer than this are reset (default 10)
  const MAX_ATTEMPTS            = parseEnvInt(Deno.env.get('MAX_ATTEMPTS'),            3);
  const BATCH_SIZE              = parseEnvInt(Deno.env.get('BATCH_SIZE'),              50);
  const PROCESSING_TIMEOUT_MINUTES = parseEnvInt(Deno.env.get('PROCESSING_TIMEOUT_MINUTES'), 10);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Atomic claim ──────────────────────────────────────────────────────────
  // The RPC function does two things inside a single DB transaction:
  //   1. Resets any rows stuck in 'processing' for > PROCESSING_TIMEOUT_MINUTES back to 'pending'
  //   2. Marks the next BATCH_SIZE due rows as 'processing' (FOR UPDATE SKIP LOCKED)
  //      and increments their `attempts` counter.
  //
  // Because the lock is held until the UPDATE completes, two concurrent cron
  // invocations can never claim the same row.
  const { data: due, error: claimError } = await supabase
    .rpc('claim_pending_emails', {
      p_batch_size:      BATCH_SIZE,
      p_timeout_minutes: PROCESSING_TIMEOUT_MINUTES,
    });

  if (claimError) {
    console.error('process-scheduled-emails: claim error', claimError);
    return new Response(JSON.stringify({ error: claimError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let processed    = 0;
  let failed       = 0;
  let dead_lettered = 0;

  for (const row of due ?? []) {
    let sendOk = false;

    try {
      // Delegate to send-vendor-email (same call as before, unchanged)
      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-vendor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          // pending_listing_id may be null — listing deleted by pg_cron after 1 day;
          // send-vendor-email falls back to vendors table using vendor_id.
          pendingListingId: row.pending_listing_id ?? undefined,
          emailType:        row.email_type,
          vendorId:         row.vendor_id ?? undefined,
          // The vendor_emails row already exists — tell send-vendor-email not to
          // insert a duplicate audit row; we update the existing row ourselves.
          skipAuditLog:     true,
        }),
      });

      if (sendRes.ok) {
        const sendBody = await sendRes.json() as { ok: boolean };
        sendOk = sendBody.ok === true;
        if (!sendOk) {
          console.error(`process-scheduled-emails: send returned ok=false for row ${row.id}`);
        }
      } else {
        const errText = await sendRes.text();
        console.error(`process-scheduled-emails: HTTP error for row ${row.id}`, sendRes.status, errText);
      }
    } catch (err) {
      console.error(`process-scheduled-emails: unexpected error for row ${row.id}`, err);
    }

    // ── Post-send status update ────────────────────────────────────────────
    if (sendOk) {
      // Happy path — mark sent.
      const { error: markError } = await supabase
        .from('vendor_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);

      if (markError) {
        // This is the narrow at-least-once window: the email was sent but we
        // couldn't record it. The row will be reset by the timeout guard on the
        // next cron tick and re-sent. Acceptable for low-volume transactional
        // email; log clearly so it can be investigated.
        console.error(`process-scheduled-emails: failed to mark row ${row.id} as sent`, markError);
        failed++;
      } else {
        processed++;
      }
    } else {
      // row.attempts was already incremented by claim_pending_emails, so we
      // compare the bumped value directly against the ceiling.
      if (shouldMarkFailed(row.attempts, MAX_ATTEMPTS)) {
        // Dead-letter: too many failed attempts, stop retrying.
        const { error: deadError } = await supabase
          .from('vendor_emails')
          .update({ status: 'failed' })
          .eq('id', row.id);

        if (deadError) {
          console.error(`process-scheduled-emails: failed to dead-letter row ${row.id}`, deadError);
        } else {
          console.warn(`process-scheduled-emails: dead-lettered row ${row.id} after ${row.attempts} attempts`);
          dead_lettered++;
        }
      } else {
        // Release back to 'pending' for retry on the next cron tick.
        const { error: releaseError } = await supabase
          .from('vendor_emails')
          .update({ status: 'pending', claimed_at: null })
          .eq('id', row.id);

        if (releaseError) {
          console.error(`process-scheduled-emails: failed to release row ${row.id} back to pending`, releaseError);
        }
        failed++;
      }
    }
  }

  console.log(
    `process-scheduled-emails: processed=${processed} failed=${failed} dead_lettered=${dead_lettered}`,
  );

  return new Response(JSON.stringify({ processed, failed, dead_lettered }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
