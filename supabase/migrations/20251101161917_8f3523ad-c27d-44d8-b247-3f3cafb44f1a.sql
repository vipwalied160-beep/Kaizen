-- Update default classroom radius to 100 meters
ALTER TABLE public.attendance_sessions 
  ALTER COLUMN classroom_radius_meters SET DEFAULT 100;

-- Add course_id to attendance sessions to track which course each session belongs to
ALTER TABLE public.attendance_sessions
  ADD COLUMN IF NOT EXISTS course_id text;

-- Create index for faster course-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_course_id 
  ON public.attendance_sessions(course_id);

-- Create notifications table for real-time student alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Students can view their own notifications
CREATE POLICY "Students can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Professors can create notifications
CREATE POLICY "Professors can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'professor'));

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Add realtime support for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Make user_id and professor_id NOT NULL to enforce proper ownership
ALTER TABLE public.attendance_records 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.device_fingerprints 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.students_grades 
  ALTER COLUMN professor_id SET NOT NULL;

ALTER TABLE public.attendance_sessions 
  ALTER COLUMN professor_id SET NOT NULL;