-- Check the current custom access hook function
SELECT 
    hook_name,
    hook_function_name,
    enabled
FROM 
    auth.hooks
WHERE 
    hook_name = 'jwt_claim'; 