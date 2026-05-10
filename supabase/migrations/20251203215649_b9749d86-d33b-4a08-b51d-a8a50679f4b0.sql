-- Add course_id column to students_grades table for multi-course support
ALTER TABLE public.students_grades 
ADD COLUMN IF NOT EXISTS course_id TEXT DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_grades_course_id ON public.students_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_students_grades_professor_course ON public.students_grades(professor_id, course_id);