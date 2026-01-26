-- Fix the remaining overly permissive contact_messages policy
-- The old policy "Anyone can submit contact messages" with WITH CHECK (true) was replaced
-- in an earlier migration but the old one still exists

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- The rate_limited_contact_messages policy already exists from earlier migration
-- with proper validation checks