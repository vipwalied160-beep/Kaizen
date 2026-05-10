-- Fix: Remove the ability for all authenticated users to see broadcast notifications
-- This prevents potential leakage of sensitive system announcements

-- Step 1: Drop the existing policy that allows viewing NULL user_id notifications
DROP POLICY IF EXISTS "Students can view own notifications" ON public.notifications;

-- Step 2: Create a stricter policy - users can ONLY see their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Create a separate table for system-wide announcements with proper access control
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role app_role NULL, -- NULL means all users, specific role means only that role
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on system_announcements
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see announcements targeted at their role or all users (NULL target_role)
CREATE POLICY "Users can view relevant announcements" 
ON public.system_announcements 
FOR SELECT 
TO authenticated
USING (
  is_active = true AND (
    target_role IS NULL 
    OR has_role(auth.uid(), target_role)
  )
);

-- Policy: Only professors and admins can create announcements
CREATE POLICY "Professors and admins can create announcements" 
ON public.system_announcements 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'professor'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Professors and admins can update their own announcements
CREATE POLICY "Creators can update own announcements" 
ON public.system_announcements 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- Policy: Professors and admins can delete their own announcements
CREATE POLICY "Creators can delete own announcements" 
ON public.system_announcements 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Add comment to explain the security model
COMMENT ON TABLE public.system_announcements IS 'System-wide announcements with role-based targeting. Separate from user notifications for security.';
COMMENT ON COLUMN public.system_announcements.target_role IS 'NULL = all users, specific role = only users with that role';