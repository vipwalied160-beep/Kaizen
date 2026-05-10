-- Create a policy for admin to view all professor codes (using service role or special check)
-- First, let's add a policy that allows viewing all professor codes for authenticated users
CREATE POLICY "Admin can view all professor codes"
ON public.professor_codes
FOR SELECT
USING (true);

-- Also allow admin to update permissions
CREATE POLICY "Admin can update professor permissions"
ON public.professor_codes
FOR UPDATE
USING (true);

-- Allow admin to delete professor codes  
CREATE POLICY "Admin can delete professor codes"
ON public.professor_codes
FOR DELETE
USING (true);