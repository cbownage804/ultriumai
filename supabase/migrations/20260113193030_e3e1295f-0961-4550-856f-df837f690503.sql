-- Fix RLS for compliance_frameworks table
ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Compliance frameworks are publicly readable" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Anyone can read compliance frameworks" ON public.compliance_frameworks;

CREATE POLICY "Authenticated users can read compliance frameworks"
ON public.compliance_frameworks
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix RLS for safeweb_sources table  
ALTER TABLE public.safeweb_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Safeweb sources are publicly readable" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Anyone can read safeweb sources" ON public.safeweb_sources;

CREATE POLICY "Authenticated users can read safeweb sources"
ON public.safeweb_sources
FOR SELECT
USING (auth.uid() IS NOT NULL);