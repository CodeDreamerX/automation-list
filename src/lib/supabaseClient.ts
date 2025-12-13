// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Using non-PUBLIC variables since this is server-side only
// PUBLIC_ prefix would expose these in client bundle unnecessarily
// In SSR mode, import.meta.env is replaced at build time, so we need process.env at runtime
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
