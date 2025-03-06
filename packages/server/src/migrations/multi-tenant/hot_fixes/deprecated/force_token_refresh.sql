-- Force token refresh for a user

-- This will invalidate all existing sessions for the user
-- and force them to log in again, which will generate a new token
-- with the updated custom_access_token_hook function

DO $$
DECLARE
    target_user_id UUID;
    target_user_id_text TEXT;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'brian+test@remodl.ai'
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found';
        RETURN;
    END IF;
    
    -- Convert UUID to text for comparison
    target_user_id_text := target_user_id::TEXT;
    
    -- Delete all refresh tokens for the user
    DELETE FROM auth.refresh_tokens
    WHERE user_id = target_user_id_text;
    
    -- Update the user's last_sign_in_at to force token refresh
    UPDATE auth.users
    SET last_sign_in_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Tokens invalidated for user ID: %', target_user_id;
END $$; 