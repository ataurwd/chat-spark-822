
-- Create user_reports table to track reports
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Each user can only report another user once
  UNIQUE(reporter_id, reported_user_id)
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (but not report themselves)
CREATE POLICY "Users can report others"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_id 
  AND reporter_id != reported_user_id
);

-- Users can view reports (to check report counts)
CREATE POLICY "Users can view reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (true);

-- Function to count reports for a user
CREATE OR REPLACE FUNCTION public.get_report_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_reports
  WHERE reported_user_id = _user_id
$$;

-- Function to check if user is blocked (3+ reports)
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT COUNT(*) FROM public.user_reports WHERE reported_user_id = _user_id) >= 3
$$;

-- Enable realtime for user_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reports;
