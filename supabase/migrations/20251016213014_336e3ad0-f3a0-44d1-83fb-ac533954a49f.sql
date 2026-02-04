-- Create attendance sessions table (for professor's control)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_name TEXT NOT NULL,
  session_name TEXT NOT NULL,
  classroom_latitude DOUBLE PRECISION NOT NULL,
  classroom_longitude DOUBLE PRECISION NOT NULL,
  classroom_radius_meters INTEGER DEFAULT 50,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_major TEXT NOT NULL,
  student_latitude DOUBLE PRECISION NOT NULL,
  student_longitude DOUBLE PRECISION NOT NULL,
  distance_from_classroom DOUBLE PRECISION,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  is_valid_location BOOLEAN DEFAULT false,
  UNIQUE(session_id, device_fingerprint)
);

-- Create device fingerprints table (to prevent duplicate registrations)
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  student_name TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, fingerprint_hash)
);

-- Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for demo purposes - you can restrict later)
CREATE POLICY "Anyone can view sessions" ON public.attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON public.attendance_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.attendance_sessions FOR UPDATE USING (true);

CREATE POLICY "Anyone can view records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Anyone can create records" ON public.attendance_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view fingerprints" ON public.device_fingerprints FOR SELECT USING (true);
CREATE POLICY "Anyone can create fingerprints" ON public.device_fingerprints FOR INSERT WITH CHECK (true);

-- Function to calculate distance between two GPS coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius DOUBLE PRECISION := 6371000; -- Earth's radius in meters
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat/2) * SIN(dlat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon/2) * SIN(dlon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;