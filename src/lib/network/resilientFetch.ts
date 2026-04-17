const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createResilientFetch(timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error(`Supabase fetch timed out after ${timeoutMs}ms`)), timeoutMs);

      try {
        const response = await fetch(input, {
          ...init,
          signal: init?.signal ?? controller.signal,
        });

        if (response.status >= 500 && attempt < retries) {
          await sleep(250 * (attempt + 1));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await sleep(250 * (attempt + 1));
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError ?? new Error("Supabase fetch failed");
  };
}
