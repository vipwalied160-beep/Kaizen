-- Create professor_codes table to store unique codes for each professor
CREATE TABLE public.professor_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  professor_name text NOT NULL,
  professor_email text NOT NULL,
  unique_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.professor_codes ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage professor codes"
ON public.professor_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Professors can view their own code
CREATE POLICY "Professors can view own code"
ON public.professor_codes
FOR SELECT
USING (auth.uid() = professor_id);

-- Anyone authenticated can view codes (to enter code and access professor's page)
CREATE POLICY "Authenticated users can view codes"
ON public.professor_codes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create meetings table linked to professors
CREATE TABLE public.professor_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  title text NOT NULL,
  link text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professor_meetings ENABLE ROW LEVEL SECURITY;

-- Professors can manage their own meetings
CREATE POLICY "Professors can manage own meetings"
ON public.professor_meetings
FOR ALL
USING (auth.uid() = professor_id);

-- Anyone can view active meetings
CREATE POLICY "Anyone can view active meetings"
ON public.professor_meetings
FOR SELECT
USING (is_active = true);