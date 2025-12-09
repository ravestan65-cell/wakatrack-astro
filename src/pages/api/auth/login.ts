import type { APIRoute } from 'astro';
import { signIn, createSessionToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await signIn(email, password);

    // Create session token
    const token = createSessionToken(user.id, user.email, user.is_admin);

    // Build Set-Cookie header (Astro's cookies.set() doesn't work with fetch requests)
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const cookieParts = [
      `session=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${maxAge}`
    ];
    if (import.meta.env.PROD) {
      cookieParts.push('Secure');
    }
    const cookieHeader = cookieParts.join('; ');

    console.log('[API Login] Setting session cookie for:', user.email);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin
        },
        message: 'Login successful'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );

  } catch (error) {
    console.error('[API] Login error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
