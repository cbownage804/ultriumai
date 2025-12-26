-- Fix security warnings: Remove public access and ensure proper authentication

-- 1. Fix compliance_benchmarks - drop any existing policies and create proper ones
DROP POLICY IF EXISTS "Authenticated users can view compliance benchmarks" ON public.compliance_benchmarks;
DROP POLICY IF EXISTS "Anyone can view compliance benchmarks" ON public.compliance_benchmarks;
DROP POLICY IF EXISTS "Public can view compliance benchmarks" ON public.compliance_benchmarks;

CREATE POLICY "Only authenticated users can view compliance benchmarks"
ON public.compliance_benchmarks
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix compliance_frameworks - drop any existing policies and create proper ones
DROP POLICY IF EXISTS "Authenticated users can view compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Anyone can view compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Public can view compliance frameworks" ON public.compliance_frameworks;

CREATE POLICY "Only authenticated users can view compliance frameworks"
ON public.compliance_frameworks
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix safeweb_sources - drop any existing policies and create proper ones
DROP POLICY IF EXISTS "Authenticated users can view safeweb sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Anyone can view safeweb sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Public can view safeweb sources" ON public.safeweb_sources;

CREATE POLICY "Only authenticated users can view safeweb sources"
ON public.safeweb_sources
FOR SELECT
TO authenticated
USING (true);