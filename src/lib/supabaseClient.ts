import { createClient } from "@supabase/supabase-js";
import { getRequiredEnvVar } from "./env";
import { createResilientFetch } from "./network/resilientFetch";

// ⚠️ SERVER-ONLY: This client uses the anon key for public read operations
// For admin operations, use supabaseAdmin from supabaseAdminClient.ts instead
export const supabase = createClient(
  getRequiredEnvVar("SUPABASE_URL"),
  getRequiredEnvVar("SUPABASE_ANON_KEY"),
  {
    global: {
      // Keep SSR requests fast during upstream Supabase outages.
      fetch: createResilientFetch(),
    },
  }
);
