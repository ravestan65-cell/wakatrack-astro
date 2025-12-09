import type { APIRoute } from 'astro';
import { supabase, toCamelCase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  console.log('[API] GET /api/tracking/[id] - Start', id);

  try {
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Tracking number is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First try to find by tracking_number (preferred, cleaner URLs)
    let { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_number', id)
      .single();

    // If not found by tracking_number, try by ID (backwards compatibility)
    if (shipmentError || !shipment) {
      const { data: shipmentById, error: errorById } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (errorById || !shipmentById) {
        console.log('[API] Shipment not found:', id);
        return new Response(
          JSON.stringify({ success: false, message: 'Shipment not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      shipment = shipmentById;
    }

    // Get tracking events using the shipment's actual ID
    const { data: events } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    console.log('[API] Shipment retrieved successfully:', shipment.tracking_number);

    // Convert to camelCase for frontend
    const shipmentData = toCamelCase({
      ...shipment,
      events: events || []
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: shipmentData,
        message: 'Shipment retrieved successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch shipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
