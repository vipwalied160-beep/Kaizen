-- Drop the professor_codes_public view as it exposes professor data publicly
-- The application uses the secure get_professor_by_code RPC function instead
DROP VIEW IF EXISTS public.professor_codes_public;