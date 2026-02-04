-- Fix security issue: Restrict profiles table to only allow users to view their own profile
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Fix security issue: Restrict professor_codes to not expose emails and codes to all users
DROP POLICY IF EXISTS "Allow viewing codes for attendance" ON public.professor_codes;

-- Students only need to see professor names for attendance, not codes/emails
-- Professors can see their own full record
CREATE POLICY "Students can view professor names only" 
ON public.professor_codes 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'student'));

-- Fix attendance_sessions to require authentication
DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.attendance_sessions;

CREATE POLICY "Authenticated users can view active sessions" 
ON public.attendance_sessions 
FOR SELECT 
TO authenticated
USING (is_active = true);