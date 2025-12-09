'use client';

import React, { useEffect, useRef, useState } from 'react';
import { geocodeLocation } from '../utils/geocoding';
import { Card, CardContent } from './ui/card';

interface MapCardProps {
  origin: string;
  destination: string;
  currentLocation?: string;
}

const MapCard: React.FC<MapCardProps> = ({ origin, destination, currentLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const routeLayer = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  const [coordinates, setCoordinates] = useState<{
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    current: { lat: number; lng: number } | null;
  }>({
    origin: null,
    destination: null,
    current: null
  });

  // Check if we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamically import Leaflet only on client
  useEffect(() => {
    if (!isClient) return;

    const loadLeaflet = async () => {
      const leaflet = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      setL(leaflet.default);
    };

    loadLeaflet();
  }, [isClient]);

  // Update coordinates when locations change
  useEffect(() => {
    if (!isClient) return;

    const updateCoordinates = async () => {
      const [originCoords, destCoords, currentCoords] = await Promise.all([
        origin ? geocodeLocation(origin) : null,
        destination ? geocodeLocation(destination) : null,
        currentLocation ? geocodeLocation(currentLocation) : null
      ]);

      setCoordinates({
        origin: originCoords,
        destination: destCoords,
        current: currentCoords
      });
    };

    updateCoordinates();
  }, [origin, destination, currentLocation, isClient]);

  // Initialize map
  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstance.current) return;

    // Create map
    mapInstance.current = L.map(mapRef.current, {
      minZoom: 3,
      maxZoom: 18,
      worldCopyJump: true
    }).setView([20, 0], 3);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Create layers
    markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    routeLayer.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [isClient, L]);

  // Update markers and route
  useEffect(() => {
    if (!isClient || !L || !mapInstance.current || !markersLayer.current || !routeLayer.current) return;

    // Clear existing layers
    markersLayer.current.clearLayers();
    routeLayer.current.clearLayers();

    const points: any[] = [];

    // Helper function to create custom icon with label
    const createIconWithLabel = (color: string, label: string) => L.divIcon({
      html: `
        <div class="relative">
          <div class="w-3 h-3 rounded-full bg-${color}-500 border-2 border-white shadow-lg"></div>
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded text-xs font-bold shadow-md border border-gray-300">
            ${label}
          </div>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    // Add markers with permanent labels
    if (coordinates.origin) {
      const pos: [number, number] = [coordinates.origin.lat, coordinates.origin.lng];
      points.push(pos);
      L.marker(pos, { icon: createIconWithLabel('green', 'Origin') })
        .addTo(markersLayer.current);
    }

    if (coordinates.current) {
      const pos: [number, number] = [coordinates.current.lat, coordinates.current.lng];
      points.push(pos);
      L.marker(pos, { icon: createIconWithLabel('blue', 'Current') })
        .addTo(markersLayer.current);
    }

    if (coordinates.destination) {
      const pos: [number, number] = [coordinates.destination.lat, coordinates.destination.lng];
      points.push(pos);
      L.marker(pos, { icon: createIconWithLabel('red', 'Destination') })
        .addTo(markersLayer.current);
    }

    // Draw routes with different styles for traveled and remaining
    const routePoints: any[] = [];

    // Origin to Current (traveled)
    if (coordinates.origin && coordinates.current) {
      routePoints.push({
        points: [
          [coordinates.origin.lat, coordinates.origin.lng],
          [coordinates.current.lat, coordinates.current.lng]
        ],
        type: 'traveled'
      });
    }

    // Current to Destination (remaining)
    if (coordinates.current && coordinates.destination) {
      routePoints.push({
        points: [
          [coordinates.current.lat, coordinates.current.lng],
          [coordinates.destination.lat, coordinates.destination.lng]
        ],
        type: 'remaining'
      });
    }

    // If no current location, draw direct line from origin to destination
    if (!coordinates.current && coordinates.origin && coordinates.destination) {
      routePoints.push({
        points: [
          [coordinates.origin.lat, coordinates.origin.lng],
          [coordinates.destination.lat, coordinates.destination.lng]
        ],
        type: 'remaining'
      });
    }

    // Draw the routes
    routePoints.forEach(route => {
      L.polyline(route.points, {
        color: route.type === 'traveled' ? '#22c55e' : '#ef4444',
        weight: 2.5,
        opacity: 0.8,
        dashArray: route.type === 'remaining' ? '8, 8' : undefined
      }).addTo(routeLayer.current!);
    });

    // Center map on all points
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (points.length === 1) {
      mapInstance.current.setView(points[0], 10);
    }
  }, [coordinates, origin, destination, currentLocation, isClient, L]);

  // Show loading state while waiting for client-side rendering
  if (!isClient) {
    return (
      <div className="space-y-px">
        <Card className="rounded-b-none overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500">Loading map...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-px">
      {/* Map Card */}
      <Card className="rounded-b-none overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-[300px]" />
        </CardContent>
      </Card>

      {/* Legend Row */}
      <div className="bg-white shadow-lg rounded-b-xl px-2 py-1.5">
        <div className="grid grid-cols-4 gap-2">
          {/* Origin */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="truncate">
                <span className="text-sm font-bold text-gray-900">Origin</span>
              </div>
            </div>
            <div className="pl-3 -mt-1 text-xs font-semibold text-gray-900 truncate">{origin}</div>
          </div>

          {/* Current Location */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="truncate">
                <span className="text-sm font-bold text-gray-900">Current</span>
              </div>
            </div>
            {currentLocation && (
              <div className="pl-3 -mt-1 text-xs font-semibold text-gray-900 truncate">{currentLocation}</div>
            )}
          </div>

          {/* Destination */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="truncate">
                <span className="text-sm font-bold text-gray-900">Destination</span>
              </div>
            </div>
            <div className="pl-3 -mt-1 text-xs font-semibold text-gray-900 truncate">{destination}</div>
          </div>

          {/* Route Types */}
          <div className="flex flex-col gap-0 items-end">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500" />
              <span className="text-xs font-medium text-gray-900">Distance covered</span>
            </div>
            <div className="flex items-center gap-1 -mt-0.5">
              <div className="w-3 h-0.5 bg-red-500 border-t border-dashed"
                   style={{ borderColor: '#ef4444' }} />
              <span className="text-xs font-medium text-gray-900">Distance to go</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapCard;
