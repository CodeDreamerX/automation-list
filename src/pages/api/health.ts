import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';

export const prerender = false;

export const GET: APIRoute = async () => {
  const timestamp = new Date().toISOString();

  try {
    // Simple connectivity check - query a table that exists
    // This effectively tests SELECT 1 connectivity
    const { error } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .limit(0);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp,
        error: 'Database unreachable',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

