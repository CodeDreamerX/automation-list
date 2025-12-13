// src/lib/supabaseAdminClient.ts
import { createClient } from '@supabase/supabase-js';

// ⚠️ SERVER-ONLY: This client uses the service_role key with full admin privileges
// DO NOT expose this client to the frontend - it bypasses Row Level Security (RLS)
// Use this ONLY for server-side admin CRUD operations

// In SSR mode, import.meta.env is replaced at build time, so we need process.env at runtime
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('❌ Supabase URL or Service Role Key is missing. Check your .env file.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

