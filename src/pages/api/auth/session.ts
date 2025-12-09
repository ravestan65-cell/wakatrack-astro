import type { APIRoute } from 'astro';
import { getSessionFromCookies, getUserById } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie');
    console.log('[API Session] Cookie header:', cookieHeader ? 'present' : 'missing', cookieHeader?.substring(0, 50));
    const session = getSessionFromCookies(cookieHeader);
    console.log('[API Session] Session user:', session.user ? session.user.email : 'none');

    if (!session.user) {
      return new Response(
        JSON.stringify({ success: false, user: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Optionally fetch full user data
    const user = await getUserById(session.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin
        } : session.user
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Session error:', error);
    return new Response(
      JSON.stringify({ success: false, user: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
