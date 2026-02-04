-- First drop the default, then change type, then set new default
ALTER TABLE public.students_grades 
ALTER COLUMN rating DROP DEFAULT;

ALTER TABLE public.students_grades 
ALTER COLUMN rating TYPE NUMERIC USING CASE 
  WHEN rating ~ '^[0-9]+\.?[0-9]*$' THEN rating::NUMERIC 
  ELSE 0 
END;

ALTER TABLE public.students_grades 
ALTER COLUMN rating SET DEFAULT 0;

-- Add session_name column to attendance_records if not exists
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS session_name TEXT;