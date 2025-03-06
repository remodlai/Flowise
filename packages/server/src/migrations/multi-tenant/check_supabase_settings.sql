-- Check if there's a way to see the configuration in the supabase_settings schema
SELECT 
    table_schema,
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'supabase_settings'; 