
CREATE TABLE public.network_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.company_scans(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  mac_address TEXT,
  hostname TEXT,
  os_detected TEXT,
  os_version TEXT,
  device_type TEXT,
  open_ports JSONB DEFAULT '[]'::jsonb,
  vulnerabilities JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT DEFAULT 'low',
  status TEXT DEFAULT 'online',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert network devices" ON public.network_devices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read network devices" ON public.network_devices FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.network_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.company_scans(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  total_devices INTEGER DEFAULT 0,
  total_vulnerabilities INTEGER DEFAULT 0,
  critical_devices INTEGER DEFAULT 0,
  scan_status TEXT DEFAULT 'pending',
  agent_version TEXT,
  network_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert network scans" ON public.network_scans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read network scans" ON public.network_scans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update network scans" ON public.network_scans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
