-- Fix: Convert view to SECURITY INVOKER (safer than SECURITY DEFINER)
-- This ensures the view uses the permissions of the querying user, not the view creator

-- Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.professor_codes_public;

CREATE VIEW public.professor_codes_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  professor_id,
  professor_name,
  unique_code
FROM public.professor_codes;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.professor_codes_public TO authenticated;

-- Since the view now uses SECURITY INVOKER, we need a policy on the base table
-- that allows authenticated users to see the rows (but NOT the email column)
-- The view already filters out the email column, so we just need row-level access

-- Create a policy that allows authenticated users to read professor codes
-- This policy is on the BASE table, and the view filters the columns
CREATE POLICY "Authenticated users can view professor codes via view" 
ON public.professor_codes 
FOR SELECT 
TO authenticated
USING (true);