-- Check the definition of the is_platform_admin() function
SELECT 
    pg_get_functiondef(oid) AS function_definition
FROM 
    pg_proc 
WHERE 
    proname = 'is_platform_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'); 