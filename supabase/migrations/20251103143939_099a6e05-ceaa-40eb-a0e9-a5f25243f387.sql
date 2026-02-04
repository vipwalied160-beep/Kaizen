-- Add rating column to students_grades table
ALTER TABLE public.students_grades 
ADD COLUMN IF NOT EXISTS rating TEXT DEFAULT '';