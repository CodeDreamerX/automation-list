import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get("adminSession")?.value;
  
  if (!token || token !== '1') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Vendor ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete vendor using admin client
    const { error } = await supabaseAdmin
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vendor:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to delete vendor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in delete-vendor endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

