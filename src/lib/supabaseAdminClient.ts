// src/lib/supabaseAdminClient.ts
import { createClient } from '@supabase/supabase-js';
import { getRequiredEnvVar } from './env';

// ⚠️ SERVER-ONLY: This client uses the service_role key with full admin privileges
// DO NOT expose this client to the frontend - it bypasses Row Level Security (RLS)
// Use this ONLY for server-side admin CRUD operations

const supabaseUrl = getRequiredEnvVar('SUPABASE_URL');
const supabaseServiceRoleKey = getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY');

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

