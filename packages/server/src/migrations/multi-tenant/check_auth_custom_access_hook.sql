-- Check if there's a function in the auth schema called custom_access_token_hook
SELECT 
    pg_get_functiondef(oid) AS function_definition
FROM 
    pg_proc 
WHERE 
    proname = 'custom_access_token_hook' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'); 