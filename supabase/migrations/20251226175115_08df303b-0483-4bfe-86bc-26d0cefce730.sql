
-- Fix security issues: Add RLS policies to publicly exposed tables

-- 1. compliance_benchmarks - restrict to authenticated users
ALTER TABLE public.compliance_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view compliance benchmarks"
ON public.compliance_benchmarks
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. compliance_frameworks - restrict to authenticated users  
ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view compliance frameworks"
ON public.compliance_frameworks
FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. safeweb_sources - restrict to authenticated users
ALTER TABLE public.safeweb_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view safeweb sources"
ON public.safeweb_sources
FOR SELECT
USING (auth.role() = 'authenticated');
