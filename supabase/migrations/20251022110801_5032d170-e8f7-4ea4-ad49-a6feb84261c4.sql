-- Create students_grades table for managing student grades
CREATE TABLE IF NOT EXISTS public.students_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_major TEXT,
  quiz1 NUMERIC(5,2) DEFAULT 0,
  quiz2 NUMERIC(5,2) DEFAULT 0,
  midterm NUMERIC(5,2) DEFAULT 0,
  final NUMERIC(5,2) DEFAULT 0,
  sum NUMERIC(5,2) GENERATED ALWAYS AS (quiz1 + quiz2 + midterm + final) STORED,
  degree TEXT,
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students_grades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Professors can view their own students grades"
ON public.students_grades
FOR SELECT
USING (auth.uid() = professor_id);

CREATE POLICY "Professors can insert their own students grades"
ON public.students_grades
FOR INSERT
WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Professors can update their own students grades"
ON public.students_grades
FOR UPDATE
USING (auth.uid() = professor_id);

CREATE POLICY "Professors can delete their own students grades"
ON public.students_grades
FOR DELETE
USING (auth.uid() = professor_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_students_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_students_grades_updated_at
BEFORE UPDATE ON public.students_grades
FOR EACH ROW
EXECUTE FUNCTION public.update_students_grades_updated_at();