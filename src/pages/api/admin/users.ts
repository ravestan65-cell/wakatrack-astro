import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSessionFromCookies } from '../../../lib/auth';

// GET all users (admin only)
export const GET: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session.user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!session.user.isAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all non-admin users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, is_admin, created_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: users || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
