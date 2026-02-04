-- Add unique constraint to prevent same device from registering multiple times
-- This prevents students from registering with different accounts on the same device

-- First, drop the existing device_fingerprints table to recreate with better constraints
DROP TABLE IF EXISTS public.device_fingerprints CASCADE;

-- Recreate with proper constraints
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL,
  session_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  user_id UUID,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Unique constraint: one device can only register once per session
  UNIQUE(fingerprint_hash, session_id)
);

-- Enable RLS
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view own fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Students can create fingerprints during active sessions" 
ON public.device_fingerprints 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'student'::app_role)
  AND EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE id = session_id 
    AND is_active = true 
    AND now() >= started_at 
    AND now() <= ends_at
  )
);

CREATE POLICY "Professors can view session fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE id = device_fingerprints.session_id 
    AND professor_id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX idx_device_fingerprints_session ON public.device_fingerprints(session_id);
CREATE INDEX idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);