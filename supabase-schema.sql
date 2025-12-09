-- Supabase Schema for WakaTrack
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique not null,
  password text not null,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Shipments table
create table if not exists shipments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  tracking_number text unique not null,
  order_reference_number text,
  customer_name text,
  email text,
  phone_number text,
  status_details text,
  status_color text default '#22c55e',

  -- Origin Address
  sender_name text,
  origin_street_address text,
  origin_city text,
  origin_state text,
  origin_country text,
  origin_postal_code text,
  origin text,
  origin_latitude double precision,
  origin_longitude double precision,

  -- Destination Address
  receiver_name text,
  destination_street_address text,
  destination_city text,
  destination_state text,
  destination_country text,
  destination_postal_code text,
  destination text,
  destination_latitude double precision,
  destination_longitude double precision,

  -- Package Details
  weight text,
  length text,
  width text,
  height text,
  package_type text,
  contents_description text,
  declared_value text,

  -- Shipping Details
  shipping_method text,
  tracking_progress text,
  shipment_status text,
  current_location text,
  current_latitude double precision,
  current_longitude double precision,
  description text,
  estimated_delivery_date timestamp with time zone,
  shipment_date timestamp with time zone,
  insurance_details text,

  -- Additional Information
  special_instructions text,
  return_instructions text,
  customer_notes text,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tracking Events table
create table if not exists tracking_events (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid references shipments(id) on delete cascade not null,
  status text not null,
  description text not null,
  location text,
  timestamp timestamp with time zone default now()
);

-- Admins table (legacy support)
create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password text not null,
  created_at timestamp with time zone default now()
);

-- Edit History table
create table if not exists edit_history (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid references shipments(id) on delete cascade not null,
  field_name text not null,
  old_value text,
  new_value text not null,
  timestamp timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_shipments_tracking_number on shipments(tracking_number);
create index if not exists idx_shipments_user_id on shipments(user_id);
create index if not exists idx_tracking_events_shipment_id on tracking_events(shipment_id);
create index if not exists idx_users_email on users(email);

-- Row Level Security (RLS) policies
alter table users enable row level security;
alter table shipments enable row level security;
alter table tracking_events enable row level security;
alter table admins enable row level security;

-- Public read access for tracking (anyone can track by tracking number)
create policy "Public can view shipments by tracking number" on shipments
  for select using (true);

create policy "Public can view tracking events" on tracking_events
  for select using (true);

-- Authenticated users can manage their own data
create policy "Users can view their own data" on users
  for select using (auth.uid()::text = id::text);

create policy "Users can update their own data" on users
  for update using (auth.uid()::text = id::text);

-- Service role bypass for API operations (use service role key for admin operations)
