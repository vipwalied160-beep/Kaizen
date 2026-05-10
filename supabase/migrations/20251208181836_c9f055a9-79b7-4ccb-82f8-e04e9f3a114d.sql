-- Fix: Create a secure view that only exposes non-sensitive professor data to students
-- RLS policies work at row level, not column level, so we need a view

-- First, drop the existing student policy that exposes all columns
DROP POLICY IF EXISTS "Students can view professor names only" ON public.professor_codes;

-- Create a secure view that only exposes necessary columns for students
CREATE OR REPLACE VIEW public.professor_codes_public AS
SELECT 
  id,
  professor_id,
  professor_name,
  unique_code
FROM public.professor_codes;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.professor_codes_public TO authenticated;

-- Create a security definer function for students to look up professor by code
-- This is more secure as it only returns what's needed
CREATE OR REPLACE FUNCTION public.get_professor_by_code(p_code text)
RETURNS TABLE (
  professor_id uuid,
  professor_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    professor_id,
    professor_name
  FROM public.professor_codes
  WHERE unique_code = p_code
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_professor_by_code(text) TO authenticated;