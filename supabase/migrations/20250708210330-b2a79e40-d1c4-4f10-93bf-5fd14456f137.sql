-- Create a more permissive admin policy for UltriumAI employees
-- First, let's see the current policies and create admin-specific ones

-- Drop existing restrictive policies and create admin-friendly ones
DROP POLICY IF EXISTS "Users can view analytics for their GPTs" ON daily_analytics;
DROP POLICY IF EXISTS "Users can view their own GPT analytics" ON gpt_analytics;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own GPTs only" ON custom_gpts;

-- Create admin-friendly policies
CREATE POLICY "Admins can view all analytics" ON daily_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  )
);

CREATE POLICY "Users can view analytics for their GPTs" ON daily_analytics
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  (gpt_id IN (SELECT id FROM custom_gpts WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can view all GPT analytics" ON gpt_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  )
);

CREATE POLICY "Users can view their own GPT analytics" ON gpt_analytics
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  (gpt_id IN (SELECT id FROM custom_gpts WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can view all GPTs" ON custom_gpts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  )
);

CREATE POLICY "Users can view their own GPTs only" ON custom_gpts
FOR SELECT USING (
  (user_id = auth.uid()) OR (sharing_level = 'public'::text)
);

-- Also create admin policy for profiles to allow viewing all user data
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = auth.uid() 
    AND p2.email LIKE '%@ultriumai.com'
  )
);

-- Create admin policy for subscribers table
CREATE POLICY "Admins can view all subscribers" ON subscribers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  )
);