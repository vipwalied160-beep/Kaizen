-- Fix RLS policies for professor_codes to allow admin-created professors
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can manage professor codes" ON public.professor_codes;
DROP POLICY IF EXISTS "Authenticated users can view codes" ON public.professor_codes;
DROP POLICY IF EXISTS "Professors can view own code" ON public.professor_codes;

-- Create new policies that allow the professor to manage their own code
-- And allow any authenticated user to insert (for admin signup flow)
CREATE POLICY "Users can insert own professor code" 
ON public.professor_codes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Professors can view and manage own code" 
ON public.professor_codes 
FOR ALL 
TO authenticated
USING (auth.uid() = professor_id);

CREATE POLICY "Allow viewing codes for attendance" 
ON public.professor_codes 
FOR SELECT 
TO authenticated
USING (true);

-- Fix security issues: Add authentication requirement for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can view own profile for unauthenticated check" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Fix security issues: Add authentication requirement for attendance_records
DROP POLICY IF EXISTS "Students can view own records" ON public.attendance_records;
DROP POLICY IF EXISTS "Professors can view session records" ON public.attendance_records;

CREATE POLICY "Authenticated students can view own records" 
ON public.attendance_records 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated professors can view session records" 
ON public.attendance_records 
FOR SELECT 
TO authenticated
USING (EXISTS ( SELECT 1
   FROM attendance_sessions
  WHERE attendance_sessions.id = attendance_records.session_id 
    AND attendance_sessions.professor_id = auth.uid()));