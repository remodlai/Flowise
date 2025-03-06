-- Check if there's a way to verify if the custom access token hook is enabled
-- Try to find tables or views that might contain hook configuration
SELECT 
    table_schema,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema IN ('auth', 'supabase_auth'); 