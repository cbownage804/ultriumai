-- First, let's check current auth user
DO $$
DECLARE
    current_user_email TEXT;
    current_user_id UUID;
BEGIN
    -- Get current authenticated user details
    SELECT email, id INTO current_user_email, current_user_id
    FROM auth.users 
    WHERE email = 'brandon@ultriumai.com';
    
    -- Insert or update profile for brandon@ultriumai.com
    IF current_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, user_id, email, full_name, account_type)
        VALUES (
            current_user_id,
            current_user_id, 
            'brandon@ultriumai.com',
            'Brandon',
            'business'
        )
        ON CONFLICT (id) DO UPDATE SET
            email = 'brandon@ultriumai.com',
            account_type = 'business',
            updated_at = now();
            
        RAISE NOTICE 'Profile updated for user: %', current_user_email;
    ELSE
        RAISE NOTICE 'User with email brandon@ultriumai.com not found in auth.users';
    END IF;
END
$$;