-- Fix: Remove the overly permissive policy that exposes professor emails to all users
-- The professor_codes_public VIEW should be used for public access (it excludes email)

-- Step 1: Drop the permissive policy that allows any authenticated user to read all professor codes
DROP POLICY IF EXISTS "Authenticated users can view professor codes via view" ON public.professor_codes;

-- Step 2: Professors should only see their own full record (including email)
-- The existing policy "Professors can view and manage own code" already handles this

-- Step 3: For students who need to look up professors by code, use a SECURITY DEFINER function
-- The existing get_professor_by_code function already does this safely (returns only professor_id and professor_name)

-- Note: The professor_codes_public VIEW already exists and shows only safe columns:
-- id, professor_id, professor_name, unique_code (NO email exposed)
-- Students should query the VIEW instead of the table directly

-- Add comment to clarify the security model
COMMENT ON TABLE public.professor_codes IS 'Professor codes with sensitive data. Direct table access restricted to professors viewing their own record. Use professor_codes_public view or get_professor_by_code function for public lookups.';