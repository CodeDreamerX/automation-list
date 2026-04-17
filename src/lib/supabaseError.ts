const MAX_ERROR_MESSAGE_LENGTH = 240;

export function summarizeSupabaseError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error ?? "Unknown Supabase error") };
  }

  const source = error as Record<string, unknown>;
  const message = typeof source.message === "string" ? source.message : "Unknown Supabase error";
  const normalizedMessage = message.replace(/\s+/g, " ").trim();

  const summary: Record<string, unknown> = {
    message: normalizedMessage.startsWith("<!DOCTYPE html")
      ? "Supabase upstream returned HTML error page (likely Cloudflare 5xx)"
      : normalizedMessage.slice(0, MAX_ERROR_MESSAGE_LENGTH),
  };

  if (typeof source.code === "string") summary.code = source.code;
  if (typeof source.status === "number") summary.status = source.status;
  if (typeof source.details === "string") summary.details = source.details.slice(0, MAX_ERROR_MESSAGE_LENGTH);
  if (typeof source.hint === "string") summary.hint = source.hint.slice(0, MAX_ERROR_MESSAGE_LENGTH);

  return summary;
}
