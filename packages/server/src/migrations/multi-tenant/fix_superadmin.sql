-- Fix superadmin role for a specific user
-- This script will check if a user exists and update their role to superadmin

-- Replace 'your-user-id-here' with the actual user ID
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID := 'a2132fe6-bc0d-449f-8361-c5e5b598e0e6'; -- Replace with actual user ID
BEGIN
    -- Check if user exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id
    ) INTO user_exists;
    
    IF user_exists THEN
        -- Update user metadata to set role as superadmin
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"superadmin"'
        )
        WHERE id = user_id;
        
        -- Force token refresh by updating the user's updated_at timestamp
        UPDATE auth.users
        SET updated_at = NOW()
        WHERE id = user_id;
        
        RAISE NOTICE 'User % updated to superadmin role', user_id;
    ELSE
        RAISE NOTICE 'User % not found', user_id;
    END IF;
END $$; 