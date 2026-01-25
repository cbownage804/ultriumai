-- Allow table owner (postgres) to bypass RLS for trigger operations
-- This is necessary for the handle_new_user trigger to insert profiles on signup
ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;