-- Check if there's a configuration table or setting in Supabase
-- Try to find tables or views that might contain configuration information
SELECT 
    table_schema,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'auth'
    AND (
        table_name LIKE '%config%'
        OR table_name LIKE '%setting%'
    ); 