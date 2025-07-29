-- Add missing RLS policies for critical tables (avoiding duplicates)

-- Create RLS policies for asset_history table if it exists and policies don't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asset_history') THEN
        -- Enable RLS
        ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
        
        -- Check if policies don't exist and create them
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asset_history' AND policyname = 'Users can view their own asset history') THEN
            CREATE POLICY "Users can view their own asset history" 
            ON public.asset_history 
            FOR SELECT 
            USING (changed_by = auth.uid());
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asset_history' AND policyname = 'System can insert asset history') THEN
            CREATE POLICY "System can insert asset history" 
            ON public.asset_history 
            FOR INSERT 
            WITH CHECK (true);
        END IF;
    END IF;
END
$$;

-- Create RLS policies for user_credits table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_credits') THEN
        ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_credits' AND policyname = 'Users can manage their own credits') THEN
            CREATE POLICY "Users can manage their own credits" 
            ON public.user_credits 
            FOR ALL 
            USING (user_id = auth.uid()) 
            WITH CHECK (user_id = auth.uid());
        END IF;
    END IF;
END
$$;

-- Create RLS policies for team_memberships table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_memberships') THEN
        ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_memberships' AND policyname = 'Team members can view team memberships') THEN
            CREATE POLICY "Team members can view team memberships" 
            ON public.team_memberships 
            FOR SELECT 
            USING (user_id = auth.uid() OR team_id IN (
                SELECT team_id FROM public.team_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            ));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_memberships' AND policyname = 'Team owners can manage memberships') THEN
            CREATE POLICY "Team owners can manage memberships" 
            ON public.team_memberships 
            FOR ALL 
            USING (team_id IN (
                SELECT team_id FROM public.team_memberships 
                WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
            )) 
            WITH CHECK (team_id IN (
                SELECT team_id FROM public.team_memberships 
                WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
            ));
        END IF;
    END IF;
END
$$;

-- Create RLS policies for incidents table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'incidents') THEN
        ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incidents' AND policyname = 'Users can manage their own incidents') THEN
            CREATE POLICY "Users can manage their own incidents" 
            ON public.incidents 
            FOR ALL 
            USING (user_id = auth.uid()) 
            WITH CHECK (user_id = auth.uid());
        END IF;
    END IF;
END
$$;