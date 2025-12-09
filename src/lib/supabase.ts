import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on the original Prisma schema
export interface User {
  id: string;
  name: string | null;
  email: string;
  password: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  user_id: string | null;
  tracking_number: string;
  order_reference_number: string | null;
  customer_name: string | null;
  email: string | null;
  phone_number: string | null;
  status_details: string | null;
  status_color: string | null;

  // Origin Address
  sender_name: string | null;
  origin_street_address: string | null;
  origin_city: string | null;
  origin_state: string | null;
  origin_country: string | null;
  origin_postal_code: string | null;
  origin: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;

  // Destination Address
  receiver_name: string | null;
  destination_street_address: string | null;
  destination_city: string | null;
  destination_state: string | null;
  destination_country: string | null;
  destination_postal_code: string | null;
  destination: string | null;
  destination_latitude: number | null;
  destination_longitude: number | null;

  // Package Details
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  package_type: string | null;
  contents_description: string | null;
  declared_value: string | null;

  // Shipping Details
  shipping_method: string | null;
  tracking_progress: string | null;
  shipment_status: string | null;
  current_location: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  description: string | null;
  estimated_delivery_date: string | null;
  shipment_date: string | null;
  insurance_details: string | null;

  // Additional Information
  special_instructions: string | null;
  return_instructions: string | null;
  customer_notes: string | null;

  created_at: string;
  updated_at: string;

  // Relations (populated when joined)
  events?: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
  shipment_id: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

// Helper function to convert snake_case to camelCase for frontend
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = toCamelCase(obj[key]);
  }
  return newObj;
}

// Helper function to convert camelCase to snake_case for database
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = toSnakeCase(obj[key]);
  }
  return newObj;
}
