-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'professor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  major TEXT,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table for better role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, major, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'major',
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  
  -- Add role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update attendance_sessions table to use user_id instead of professor_name
ALTER TABLE public.attendance_sessions ADD COLUMN professor_id UUID REFERENCES auth.users(id);

-- Update existing sessions (will need manual cleanup or can be set to null)
UPDATE public.attendance_sessions SET professor_id = NULL WHERE professor_id IS NULL;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.attendance_sessions;

-- New RLS policies for attendance_sessions
CREATE POLICY "Anyone can view active sessions"
  ON public.attendance_sessions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Professors can create sessions"
  ON public.attendance_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = professor_id AND public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Professors can update own sessions"
  ON public.attendance_sessions
  FOR UPDATE
  USING (auth.uid() = professor_id AND public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Professors can view own sessions"
  ON public.attendance_sessions
  FOR SELECT
  USING (auth.uid() = professor_id AND public.has_role(auth.uid(), 'professor'));

-- Update attendance_records table to use user_id
ALTER TABLE public.attendance_records ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view records" ON public.attendance_records;
DROP POLICY IF EXISTS "Anyone can create records" ON public.attendance_records;

-- New RLS policies for attendance_records
CREATE POLICY "Students can view own records"
  ON public.attendance_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professors can view session records"
  ON public.attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_records.session_id
      AND professor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own records"
  ON public.attendance_records
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_role(auth.uid(), 'student')
    AND EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = session_id
      AND is_active = true
      AND NOW() BETWEEN started_at AND ends_at
    )
  );

-- Update device_fingerprints table
ALTER TABLE public.device_fingerprints ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view fingerprints" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Anyone can create fingerprints" ON public.device_fingerprints;

-- New RLS policies for device_fingerprints
CREATE POLICY "Students can view own fingerprints"
  ON public.device_fingerprints
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professors can view session fingerprints"
  ON public.device_fingerprints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = device_fingerprints.session_id
      AND professor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own fingerprints"
  ON public.device_fingerprints
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_role(auth.uid(), 'student')
  );