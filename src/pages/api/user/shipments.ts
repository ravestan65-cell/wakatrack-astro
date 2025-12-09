import type { APIRoute } from 'astro';
import { supabase, toCamelCase, toSnakeCase } from '../../../lib/supabase';
import { getSessionFromCookies } from '../../../lib/auth';

// GET user's own shipments
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

    // Get only shipments belonging to this user
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch tracking events for all shipments
    const shipmentIds = shipments?.map(s => s.id) || [];
    let trackingEventsMap: Record<string, any[]> = {};

    if (shipmentIds.length > 0) {
      const { data: allEvents } = await supabase
        .from('tracking_events')
        .select('*')
        .in('shipment_id', shipmentIds)
        .order('timestamp', { ascending: false });

      // Group events by shipment_id
      (allEvents || []).forEach(event => {
        if (!trackingEventsMap[event.shipment_id]) {
          trackingEventsMap[event.shipment_id] = [];
        }
        trackingEventsMap[event.shipment_id].push(event);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: shipments?.map(s => toCamelCase({ ...s, events: trackingEventsMap[s.id] || [] })) || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch shipments',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST create new shipment (auto-assigns to logged-in user)
export const POST: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session.user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { events, currentCity, currentState, ...shipmentData } = body;

    // Convert empty strings to null for timestamp fields (Postgres doesn't accept empty strings for timestamps)
    if (shipmentData.estimatedDeliveryDate === '') shipmentData.estimatedDeliveryDate = null;
    if (shipmentData.shipmentDate === '') shipmentData.shipmentDate = null;

    // Convert to snake_case and auto-assign to logged-in user
    // Note: currentCity and currentState are form-only fields, not in database
    const dbData = toSnakeCase({
      ...shipmentData,
      userId: session.user.id  // Always assign to logged-in user
    });

    // Create shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert(dbData)
      .select()
      .single();

    if (shipmentError) {
      throw shipmentError;
    }

    // Create events if provided
    if (events && Array.isArray(events) && events.length > 0) {
      const eventsData = events.map((event: any) => ({
        shipment_id: shipment.id,
        status: event.status,
        description: event.description || '',
        location: event.location || null,
        timestamp: event.timestamp || new Date().toISOString()
      }));

      await supabase.from('tracking_events').insert(eventsData);
    }

    // Fetch complete shipment
    const { data: completeShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipment.id)
      .single();

    // Fetch tracking events separately
    const { data: trackingEvents } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    return new Response(
      JSON.stringify({
        success: true,
        data: toCamelCase({ ...completeShipment, events: trackingEvents || [] }),
        message: 'Shipment created successfully'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create shipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
