import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { getRequiredEnvVar } from './env';

export function createSupabaseServerClient(cookies: AstroCookies) {
  const supabaseUrl = getRequiredEnvVar('SUPABASE_URL');
  const supabaseAnonKey = getRequiredEnvVar('SUPABASE_ANON_KEY');

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (key) => cookies.get(key)?.value,
        set: (key, value, options) => cookies.set(key, value, options),
        remove: (key, options) => cookies.delete(key, options),
      },
    }
  );
}
