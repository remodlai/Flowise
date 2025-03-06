-- Run v8 Resource Auth Hook
-- This script runs the v8 resource auth hook

DO $$
DECLARE
    hook_exists BOOLEAN;
BEGIN
    -- Check if the hook exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'custom_access_token_hook' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) INTO hook_exists;
    
    IF hook_exists THEN
        RAISE NOTICE 'Hook function auth.custom_access_token_hook already exists, updating...';
    ELSE
        RAISE NOTICE 'Hook function auth.custom_access_token_hook does not exist, creating...';
    END IF;
    
    -- Run the hook creation script
    \i 'packages/server/src/migrations/multi-tenant/custom_access_hooks/v8_resource_auth_hook.sql'
    
    RAISE NOTICE 'Successfully created/updated hook function auth.custom_access_token_hook';
END $$; 