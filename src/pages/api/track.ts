import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { trackingNumber } = body;

    console.log('[API] Track request for:', trackingNumber);

    if (!trackingNumber) {
      return new Response(
        JSON.stringify({ success: false, message: 'Tracking number is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find shipment by tracking number
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('id, tracking_number')
      .eq('tracking_number', trackingNumber.trim())
      .single();

    if (error || !shipment) {
      console.log('[API] Shipment not found:', trackingNumber);
      return new Response(
        JSON.stringify({ success: false, message: 'Shipment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API] Found shipment:', shipment.id);

    // Create a tracking access token (valid for 30 minutes)
    // Use btoa for Cloudflare Workers compatibility (no Buffer in edge runtime)
    const trackingToken = btoa(JSON.stringify({
      trackingNumber: shipment.tracking_number,
      timestamp: Date.now(),
      exp: Date.now() + (30 * 60 * 1000) // 30 minutes
    }));

    // Set cookie for tracking access
    cookies.set('tracking_access', trackingToken, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 30 // 30 minutes
    });

    return new Response(
      JSON.stringify({
        success: true,
        shipmentId: shipment.id,
        trackingNumber: shipment.tracking_number
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to track shipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
