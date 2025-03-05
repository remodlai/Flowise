-- Check if the custom access token hook is registered correctly

-- Check if the hook exists in the hooks table
SELECT * FROM supabase_functions.hooks WHERE hook_table_id = 'auth.jwt';

-- Check if the function exists
SELECT 
    routine_name, 
    routine_type, 
    data_type AS return_type
FROM 
    information_schema.routines
WHERE 
    routine_name = 'custom_access_token_hook'
    AND routine_schema = 'public';

-- Check the function definition
SELECT pg_get_functiondef('public.custom_access_token_hook(jsonb)'::regprocedure); 