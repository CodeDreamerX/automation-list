import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { checkRateLimit, resetRateLimit, getClientIP, DEFAULT_LOGIN_RATE_LIMIT } from '../../../lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login?error=Invalid+credentials' },
    });
  }

  // Rate limiting: Check both IP and email to prevent brute force attacks
  const clientIP = getClientIP(request);
  const ipRateLimit = checkRateLimit(`login:ip:${clientIP}`, DEFAULT_LOGIN_RATE_LIMIT);
  const emailRateLimit = checkRateLimit(`login:email:${email.toLowerCase()}`, DEFAULT_LOGIN_RATE_LIMIT);

  // If either IP or email is rate limited, block the request
  if (!ipRateLimit.allowed) {
    const retryAfter = ipRateLimit.retryAfter || Math.ceil(DEFAULT_LOGIN_RATE_LIMIT.windowMs / 1000);
    return new Response(null, {
      status: 302,
      headers: { 
        Location: `/admin/login?error=Too+many+login+attempts.+Please+try+again+in+${retryAfter}+seconds.`,
        'Retry-After': retryAfter.toString()
      },
    });
  }

  if (!emailRateLimit.allowed) {
    const retryAfter = emailRateLimit.retryAfter || Math.ceil(DEFAULT_LOGIN_RATE_LIMIT.windowMs / 1000);
    return new Response(null, {
      status: 302,
      headers: { 
        Location: `/admin/login?error=Too+many+login+attempts+for+this+email.+Please+try+again+in+${retryAfter}+seconds.`,
        'Retry-After': retryAfter.toString()
      },
    });
  }

  const supabase = createSupabaseServerClient(cookies);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login?error=Invalid+credentials' },
    });
  }

  // Query user_roles table using admin client to bypass RLS
  // This is necessary because we need to check the role before the user is fully authenticated
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .limit(1)
    .maybeSingle();

  // Check for query errors
  if (roleError) {
    console.error('Error querying user_roles:', roleError);
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login?error=Database+error+checking+permissions' },
    });
  }

  // Only allow if role='admin'
  if (roleData?.role !== 'admin') {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/login?error=Not+authorized.+Please+contact+an+administrator.' },
    });
  }

  // On successful login, reset rate limits for this IP and email
  resetRateLimit(`login:ip:${clientIP}`);
  resetRateLimit(`login:email:${email.toLowerCase()}`);

  // On success → redirect('/admin')
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin' },
  });
};


