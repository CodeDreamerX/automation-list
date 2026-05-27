import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VALID_EMAIL_TYPES = ['approved', 'rejected', 'backlink_followup', 'import_backlink_followup'] as const;
type EmailType = typeof VALID_EMAIL_TYPES[number];

const FROM_ADDRESS = 'listings@automation-list.com';
const SITE_URL = 'https://www.automation-list.com';

function buildApprovedHtml(listingUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px;">
        <tr><td>
          <h1 style="margin:0 0 24px;font-size:22px;color:#111827;">Your listing is live on Automation-List</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Your company is now listed on Automation-List and visible to businesses
            searching for automation services worldwide. You can view your listing here:
            <a href="${listingUrl}" style="color:#4f46e5;">${listingUrl}</a>
          </p>
          <p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
            Best regards,<br>The Automation-List team
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildRejectedHtml(rejectReason: string | null): string {
  const reasonBlock = rejectReason
    ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
         <strong>Reason:</strong> ${rejectReason}
       </p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px;">
        <tr><td>
          <h1 style="margin:0 0 24px;font-size:22px;color:#111827;">Your Automation-List submission</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Thank you for submitting your company to Automation-List. After reviewing your submission,
            we are unable to include it in the directory at this time.
          </p>
          ${reasonBlock}
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            You are welcome to review our listing criteria and resubmit at
            <a href="${SITE_URL}/en/submit-listing" style="color:#4f46e5;">${SITE_URL}/en/submit-listing</a>.
          </p>
          <p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
            Best regards,<br>The Automation-List team
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildImportBacklinkHtml(website: string | null, listingUrl: string): string {
  const websiteAndReply = website
    ? `It references your website at <a href="${website}" style="color:#4f46e5;">${website}</a>. If anything looks off or you'd like to update it, just reply and we'll sort it.`
    : `If anything looks off or you'd like to update it, just reply and we'll sort it.`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px;">
        <tr><td>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            We've added your company to Automation-List — a free global directory for industrial automation vendors. Your listing is live here:<br>
            <a href="${listingUrl}" style="color:#4f46e5;">${listingUrl}</a>
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            ${websiteAndReply}
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            One small ask: if you have a resources page, blog, or partners section, would you consider adding a link back to <a href="${SITE_URL}" style="color:#4f46e5;">automation-list.com</a>? It helps other automation professionals find the directory — and your listing.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            No obligation at all. Your listing stays free either way.
          </p>
          <p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
            Best,<br>Kevin<br>Automation-List
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildBacklinkHtml(website: string | null, listingUrl: string): string {
  const websiteNote = website
    ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
         Your listing references your website at <a href="${website}" style="color:#4f46e5;">${website}</a>.
       </p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px;">
        <tr><td>
          <h1 style="margin:0 0 24px;font-size:22px;color:#111827;">Your Automation-List listing — quick question</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Your company has been listed on
            <a href="${listingUrl}" style="color:#4f46e5;">Automation-List</a>
            for about three weeks now — we hope it has been bringing you some visibility.
          </p>
          ${websiteNote}
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            If you have a resources page, a blog, or a partners section
            on your site, would you consider adding a link back to
            <a href="${SITE_URL}" style="color:#4f46e5;">automation-list.com</a>?
            It helps other automation professionals find the directory.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            No pressure at all — we appreciate you being part of the directory either way.
          </p>
          <p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
            Best regards,<br>The Automation-List team
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { pendingListingId?: string; emailType?: string; vendorId?: string; skipAuditLog?: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // skipAuditLog=true when called by process-scheduled-emails: the vendor_emails
  // row already exists and will be updated by the caller — no new row needed.
  const { pendingListingId, emailType, vendorId, skipAuditLog = false } = body;
  const type = emailType as EmailType;

  if (!emailType || !VALID_EMAIL_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: `emailType must be one of: ${VALID_EMAIL_TYPES.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // pendingListingId required for approved/rejected;
  // backlink_followup and import_backlink_followup run without it (listing deleted or never existed)
  const noListingRequired = type === 'backlink_followup' || type === 'import_backlink_followup';
  if (!pendingListingId && !noListingRequired) {
    return new Response(JSON.stringify({ error: 'pendingListingId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not set');
    return new Response(JSON.stringify({ error: 'Email service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve sender data: try pending_listings first, fall back to vendors for backlink_followup
  let recipientEmail: string | null = null;
  let website: string | null = null;
  let rejectReason: string | null = null;

  if (pendingListingId) {
    const { data: listing } = await supabase
      .from('pending_listings')
      .select('email, website, reject_reason')
      .eq('id', pendingListingId)
      .maybeSingle();
    if (listing) {
      recipientEmail = listing.email;
      website = listing.website;
      rejectReason = listing.reject_reason;
    }
  }

  // backlink_followup / import_backlink_followup: pending_listing is deleted after 1 day by pg_cron
  // (or never existed for imports) — use vendors table as the authoritative source instead
  if (!recipientEmail && noListingRequired && vendorId) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('email, website')
      .eq('id', vendorId)
      .maybeSingle();
    if (vendor) {
      recipientEmail = vendor.email;
      website = vendor.website;
    }
  }

  if (!recipientEmail) {
    console.warn(`send-vendor-email: no recipient email found — pendingListingId=${pendingListingId} vendorId=${vendorId}`);
    return new Response(JSON.stringify({ ok: false, error: 'No recipient email' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resolve vendor listing URL (used in approved + backlink_followup emails)
  let listingUrl = SITE_URL;
  if (vendorId) {
    const { data: vendor } = await supabase
      .from('vendors').select('slug').eq('id', vendorId).maybeSingle();
    if (vendor?.slug) listingUrl = `${SITE_URL}/en/vendor/${vendor.slug}`;
  }

  let subject: string;
  let html: string;

  if (type === 'approved') {
    subject = 'Your Automation-List listing is live';
    html = buildApprovedHtml(listingUrl);
  } else if (type === 'rejected') {
    subject = 'Your Automation-List submission';
    html = buildRejectedHtml(rejectReason);
  } else if (type === 'import_backlink_followup') {
    subject = 'Your Automation-List listing — quick question';
    html = buildImportBacklinkHtml(website, listingUrl);
  } else {
    subject = 'Your Automation-List listing — quick question';
    html = buildBacklinkHtml(website, listingUrl);
  }

  let emailStatus: 'sent' | 'failed' = 'failed';

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [recipientEmail], subject, html }),
    });

    if (resendRes.ok) {
      emailStatus = 'sent';
    } else {
      const errBody = await resendRes.text();
      console.error('send-vendor-email: Resend API error', resendRes.status, errBody);
    }
  } catch (sendErr) {
    console.error('send-vendor-email: fetch error', sendErr);
  }

  // Audit log row — skipped when called by process-scheduled-emails, which
  // owns the existing vendor_emails row and updates it directly after this call.
  if (!skipAuditLog) {
    const { error: logError } = await supabase.from('vendor_emails').insert({
      pending_listing_id: pendingListingId ?? null,
      vendor_id: vendorId ?? null,
      email_type: type,
      recipient_email: recipientEmail,
      sent_at: new Date().toISOString(),
      status: emailStatus,
    });
    if (logError) {
      console.error('send-vendor-email: failed to insert vendor_emails audit row', logError);
    }
  }

  // Queue backlink follow-up 21 days out when approval email sent successfully
  if (type === 'approved' && emailStatus === 'sent') {
    const scheduledFor = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const { error: schedError } = await supabase.from('vendor_emails').insert({
      pending_listing_id: pendingListingId ?? null,
      vendor_id: vendorId ?? null,
      email_type: 'backlink_followup',
      recipient_email: recipientEmail,
      scheduled_for: scheduledFor,
      status: 'pending',
    });
    if (schedError) {
      console.error('send-vendor-email: failed to queue backlink follow-up', schedError);
    }
  }

  return new Response(JSON.stringify({ ok: emailStatus === 'sent' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
