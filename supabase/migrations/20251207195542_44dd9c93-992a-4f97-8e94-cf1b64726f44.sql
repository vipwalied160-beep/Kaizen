-- Add permissions column to professor_codes table
ALTER TABLE public.professor_codes 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"attendance": true, "grades": true, "exams": true, "meetings": true, "courses": true}'::jsonb;

-- Add professor_code column to track which professor the student registered with
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS professor_code TEXT;

-- Update RLS for attendance records to filter by professor
DROP POLICY IF EXISTS "Students can view own records" ON public.attendance_records;
CREATE POLICY "Students can view own records" 
ON public.attendance_records 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for faster professor code lookups
CREATE INDEX IF NOT EXISTS idx_professor_codes_unique_code ON public.professor_codes(unique_code);
CREATE INDEX IF NOT EXISTS idx_attendance_records_professor_code ON public.attendance_records(professor_code);