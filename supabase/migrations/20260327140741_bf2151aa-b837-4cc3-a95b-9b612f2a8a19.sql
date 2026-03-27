-- Create table for company scan registrations
CREATE TABLE public.company_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  it_responsible TEXT NOT NULL,
  email TEXT NOT NULL,
  scan_score INTEGER,
  total_vulnerabilities INTEGER,
  critical_count INTEGER,
  high_count INTEGER,
  medium_count INTEGER,
  low_count INTEGER,
  open_ports_count INTEGER,
  exposed_emails_count INTEGER,
  scan_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_scans ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Anyone can insert company scans"
ON public.company_scans
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading own scan by id (for report viewing)
CREATE POLICY "Anyone can read company scans"
ON public.company_scans
FOR SELECT
TO anon, authenticated
USING (true);