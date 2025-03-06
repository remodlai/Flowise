-- Check if the roles table exists and its structure

-- Check if roles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
) AS roles_table_exists;

-- If roles table exists, show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'roles'
ORDER BY ordinal_position;

-- Check for any tables that might contain role information
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%role%'
ORDER BY table_name; 