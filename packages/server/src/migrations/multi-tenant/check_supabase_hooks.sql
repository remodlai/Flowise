-- Check if there's a way to see the registered hooks in Supabase
-- Try to find tables or views that might contain hook information
SELECT 
    table_schema,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'auth'
    AND table_name LIKE '%hook%'; 