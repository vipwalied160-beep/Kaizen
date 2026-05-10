-- Fix 1: Attendance records - ensure professors can only view records for their OWN sessions
-- AND verify they have the professor role
DROP POLICY IF EXISTS "Authenticated professors can view session records" ON public.attendance_records;

CREATE POLICY "Professors can view own session records" 
ON public.attendance_records 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM attendance_sessions
    WHERE attendance_sessions.id = attendance_records.session_id 
    AND attendance_sessions.professor_id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'professor')
);

-- Fix 2: Professor meetings - require authentication for viewing active meetings
DROP POLICY IF EXISTS "Anyone can view active meetings" ON public.professor_meetings;

CREATE POLICY "Authenticated users can view active meetings" 
ON public.professor_meetings 
FOR SELECT 
TO authenticated
USING (is_active = true);