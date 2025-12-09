import type { APIRoute } from 'astro';
import { supabase, toCamelCase, toSnakeCase } from '../../../../lib/supabase';
import { getSessionFromCookies } from '../../../../lib/auth';

// GET single shipment
export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params;

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

    // Fetch shipment
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !shipment) {
      return new Response(
        JSON.stringify({ success: false, message: 'Shipment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch tracking events separately
    const { data: trackingEvents } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', id)
      .order('timestamp', { ascending: false });

    return new Response(
      JSON.stringify({
        success: true,
        data: toCamelCase({ ...shipment, events: trackingEvents || [] })
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

// PUT update shipment
export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;

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

    const body = await request.json();
    const { events, currentCity, currentState, ...shipmentData } = body;

    // Convert empty strings to null for timestamp fields (Postgres doesn't accept empty strings for timestamps)
    if (shipmentData.estimatedDeliveryDate === '') shipmentData.estimatedDeliveryDate = null;
    if (shipmentData.shipmentDate === '') shipmentData.shipmentDate = null;

    // Convert to snake_case for database
    // Note: currentCity and currentState are form-only fields, not in database
    const dbData = toSnakeCase(shipmentData);
    dbData.updated_at = new Date().toISOString();

    // Update shipment
    const { data: updatedShipment, error: updateError } = await supabase
      .from('shipments')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update events if provided
    console.log('[API] Received events:', events);
    if (events && Array.isArray(events)) {
      // Delete existing events
      const { error: deleteError } = await supabase
        .from('tracking_events')
        .delete()
        .eq('shipment_id', id);

      if (deleteError) {
        console.error('[API] Error deleting events:', deleteError);
      }

      // Create new events
      if (events.length > 0) {
        const eventsData = events.map((event: any) => ({
          shipment_id: id,
          status: event.status,
          description: event.description || '',
          location: event.location || null,
          timestamp: event.timestamp || new Date().toISOString()
        }));

        console.log('[API] Inserting events:', eventsData);
        const { error: insertError } = await supabase.from('tracking_events').insert(eventsData);
        if (insertError) {
          console.error('[API] Error inserting events:', insertError);
        } else {
          console.log('[API] Events inserted successfully');
        }
      }
    } else {
      console.log('[API] No events to update');
    }

    // Fetch complete shipment
    const { data: completeShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single();

    // Fetch tracking events separately
    const { data: trackingEvents } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', id)
      .order('timestamp', { ascending: false });

    return new Response(
      JSON.stringify({
        success: true,
        data: toCamelCase({ ...completeShipment, events: trackingEvents || [] }),
        message: 'Shipment updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update shipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE shipment
export const DELETE: APIRoute = async ({ params, request }) => {
  const { id } = params;

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

    // Delete events first (cascade should handle this, but just in case)
    await supabase
      .from('tracking_events')
      .delete()
      .eq('shipment_id', id);

    // Delete shipment
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shipment deleted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to delete shipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
