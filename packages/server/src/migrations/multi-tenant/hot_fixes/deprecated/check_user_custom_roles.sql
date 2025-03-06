-- Check the user_custom_roles table structure

-- Show the structure of the user_custom_roles table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_custom_roles'
ORDER BY ordinal_position;

-- Show a sample of data from the user_custom_roles table
SELECT * FROM public.user_custom_roles LIMIT 5; 