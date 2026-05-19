import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: due, error: queryError } = await supabase
    .from('vendor_emails')
    .select('id, pending_listing_id, email_type, vendor_id')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (queryError) {
    console.error('process-scheduled-emails: query error', queryError);
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let processed = 0;
  let failed = 0;

  for (const row of due ?? []) {
    try {
      // Use raw fetch instead of supabase.functions.invoke — the JS client's internal
      // auth header handling conflicts with service-role-key function-to-function calls.
      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-vendor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          // pending_listing_id may be null — listing is deleted by pg_cron after 1 day;
          // send-vendor-email falls back to vendors table using vendor_id
          pendingListingId: row.pending_listing_id ?? undefined,
          emailType: row.email_type,
          vendorId: row.vendor_id ?? undefined,
        }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error(`process-scheduled-emails: invoke error for row ${row.id}`, sendRes.status, errText);
        failed++;
        continue;
      }

      const sendBody = await sendRes.json() as { ok: boolean };
      if (!sendBody.ok) {
        console.error(`process-scheduled-emails: send failed for row ${row.id} — leaving pending for retry`);
        failed++;
        continue;
      }

      const { error: markError } = await supabase
        .from('vendor_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);

      if (markError) {
        console.error(`process-scheduled-emails: failed to mark row ${row.id} as sent`, markError);
        failed++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`process-scheduled-emails: unexpected error for row ${row.id}`, err);
      failed++;
    }
  }

  console.log(`process-scheduled-emails: processed=${processed} failed=${failed}`);

  return new Response(JSON.stringify({ processed, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
