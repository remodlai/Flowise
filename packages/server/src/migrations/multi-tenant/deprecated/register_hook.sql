-- Register the custom access token hook

-- First, check if the hook already exists
DO $$
DECLARE
    hook_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM supabase_functions.hooks 
        WHERE hook_table_id = 'auth.jwt'
        AND hook_name = 'custom_access_token_hook'
    ) INTO hook_exists;
    
    IF hook_exists THEN
        RAISE NOTICE 'Hook already exists, updating...';
        
        -- Delete existing hook
        DELETE FROM supabase_functions.hooks 
        WHERE hook_table_id = 'auth.jwt'
        AND hook_name = 'custom_access_token_hook';
    END IF;
    
    -- Register the hook
    INSERT INTO supabase_functions.hooks (
        hook_table_id,
        hook_name,
        hook_function_name,
        hook_function_schema,
        hook_events
    )
    VALUES (
        'auth.jwt',
        'custom_access_token_hook',
        'custom_access_token_hook',
        'public',
        '{"event":"jwt","phase":"transform"}'::jsonb
    );
    
    RAISE NOTICE 'Hook registered successfully';
END $$;

-- Force a refresh of all user tokens to apply the new hook
-- Uncomment this line to force refresh for all users (use with caution)
-- UPDATE auth.users SET updated_at = NOW(); 