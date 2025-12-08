import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export const prerender = false;

const handleLogout = async (cookies: any) => {
  const supabase = createSupabaseServerClient(cookies);
  await supabase.auth.signOut();

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login' },
  });
};

export const GET: APIRoute = async ({ cookies }) => {
  return handleLogout(cookies);
};

export const POST: APIRoute = async ({ cookies }) => {
  return handleLogout(cookies);
};



