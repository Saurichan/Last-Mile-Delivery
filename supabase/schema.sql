-- ==========================================================
-- LAST MILE DELIVERY ROUTE OPTIMIZER - DATABASE SCHEMA
-- PostgreSQL + Supabase Row Level Security (RLS)
-- ==========================================================

-- 1. Profiles Table (Extends Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'dispatcher', 'driver', 'customer')),
  avatar_url TEXT,
  phone TEXT,
  business_name TEXT,
  business_type TEXT,
  business_location TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  depot_name TEXT NOT NULL,
  depot_address TEXT NOT NULL,
  depot_lat DOUBLE PRECISION NOT NULL,
  depot_lng DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  fuel_price_per_liter NUMERIC(10,2) NOT NULL DEFAULT 1.45,
  return_to_depot BOOLEAN NOT NULL DEFAULT TRUE,
  max_route_duration_minutes INTEGER NOT NULL DEFAULT 480,
  default_start_time TEXT NOT NULL DEFAULT '09:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Business Delivery Rules Table
CREATE TABLE IF NOT EXISTS public.business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  time_sensitivity_weight INTEGER NOT NULL DEFAULT 8,
  freshness_weight INTEGER NOT NULL DEFAULT 8,
  priority_weight INTEGER NOT NULL DEFAULT 8,
  distance_efficiency_weight INTEGER NOT NULL DEFAULT 7,
  urgency_weight INTEGER NOT NULL DEFAULT 8,
  customer_availability_weight INTEGER NOT NULL DEFAULT 8,
  batch_delivery_weight INTEGER NOT NULL DEFAULT 6,
  capacity_weight INTEGER NOT NULL DEFAULT 7,
  waiting_time_tolerance_min INTEGER NOT NULL DEFAULT 10,
  default_service_time_min INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'on_duty', 'delivering', 'offline')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  hourly_wage NUMERIC(10,2) NOT NULL DEFAULT 22.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bike', 'scooter', 'car', 'van', 'truck', 'ev_van')),
  max_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 100,
  max_package_capacity INTEGER NOT NULL DEFAULT 20,
  mileage_km_per_liter NUMERIC(10,2) NOT NULL DEFAULT 14,
  fuel_type TEXT NOT NULL DEFAULT 'petrol' CHECK (fuel_type IN ('petrol', 'diesel', 'ev', 'cng')),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'General',
  weight_kg NUMERIC(10,2) NOT NULL DEFAULT 1.0,
  volume_m3 NUMERIC(10,3) DEFAULT 0.02,
  package_count INTEGER DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'flexible')),
  time_window_start TEXT,
  time_window_end TEXT,
  deadline TEXT,
  service_time_minutes INTEGER NOT NULL DEFAULT 4,
  is_fragile BOOLEAN NOT NULL DEFAULT FALSE,
  is_temperature_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  special_instructions TEXT,
  assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'en_route', 'arriving', 'delivered', 'failed', 'rescheduled', 'cancelled')),
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_position INTEGER,
  failure_reason TEXT,
  failure_notes TEXT,
  rescheduled_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Proof of Delivery Table
CREATE TABLE IF NOT EXISTS public.proof_of_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  signature_url TEXT,
  photo_url TEXT,
  otp_code TEXT,
  is_otp_verified BOOLEAN DEFAULT FALSE,
  recipient_name TEXT,
  notes TEXT,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Optimization Runs History Table
CREATE TABLE IF NOT EXISTS public.optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL,
  order_count INTEGER NOT NULL,
  algorithm_used TEXT NOT NULL,
  before_distance_km NUMERIC(10,2) NOT NULL,
  after_distance_km NUMERIC(10,2) NOT NULL,
  distance_saved_km NUMERIC(10,2) NOT NULL,
  percent_distance_saved NUMERIC(5,2) NOT NULL,
  before_duration_min NUMERIC(10,1) NOT NULL,
  after_duration_min NUMERIC(10,1) NOT NULL,
  time_saved_min NUMERIC(10,1) NOT NULL,
  before_late_count INTEGER NOT NULL DEFAULT 0,
  after_late_count INTEGER NOT NULL DEFAULT 0,
  before_cost NUMERIC(10,2) NOT NULL,
  after_cost NUMERIC(10,2) NOT NULL,
  cost_saved NUMERIC(10,2) NOT NULL,
  fuel_saved_liters NUMERIC(10,2) NOT NULL,
  co2_saved_kg NUMERIC(10,2) NOT NULL,
  score NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_business_status ON public.orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_optimization_runs_business ON public.optimization_runs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public read-write for demo mode" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Allow public read-write for orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow public read-write for drivers" ON public.drivers FOR ALL USING (true);
CREATE POLICY "Allow public read-write for vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Allow public read-write for optimization_runs" ON public.optimization_runs FOR ALL USING (true);
