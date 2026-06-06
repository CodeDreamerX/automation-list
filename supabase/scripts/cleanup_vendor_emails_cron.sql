-- Cleanup old vendor_emails audit/queue rows via pg_cron.
-- Run this in the Supabase SQL Editor (Database → SQL).
--
-- Deletes terminal rows only:
--   - status = 'sent'  or  status = 'failed'
-- Keeps:
--   - status = 'pending' or 'processing' (active queue)
--
-- Retention: 14 days (based on COALESCE(sent_at, created_at, scheduled_for)).

-- ─── 1. Cleanup function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_vendor_emails(p_retention_days integer DEFAULT 14)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.vendor_emails
  WHERE status IN ('sent', 'failed')
    AND COALESCE(sent_at, created_at, scheduled_for) < now() - make_interval(days => p_retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ─── 2. pg_cron schedule ─────────────────────────────────────────────────────
-- Daily at 04:00 UTC (after the approved pending_listings cleanup at 03:00 UTC).

-- Safe to re-run: remove an existing job with the same name first.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cleanup-vendor-emails';

SELECT cron.schedule(
  'cleanup-vendor-emails',
  '0 4 * * *',
  $$SELECT public.cleanup_vendor_emails(14)$$
);

-- ─── 3. Verify ───────────────────────────────────────────────────────────────

-- List scheduled jobs:
-- SELECT jobid, jobname, schedule, command FROM cron.job ORDER BY jobname;

-- Dry-run: see how many rows would be deleted (does not delete):
-- SELECT COUNT(*)
-- FROM public.vendor_emails
-- WHERE status IN ('sent', 'failed')
--   AND COALESCE(sent_at, created_at, scheduled_for) < now() - interval '14 days';

-- Manual run:
-- SELECT public.cleanup_vendor_emails(14);
