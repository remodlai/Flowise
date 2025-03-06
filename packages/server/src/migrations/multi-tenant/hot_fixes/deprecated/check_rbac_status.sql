-- Diagnostic script to check RBAC status

-- Check if the Super Admin role exists
SELECT 
    id, 
    name, 
    description, 
    context_type, 
    context_id
FROM 
    public.custom_roles
WHERE 
    name = 'Super Admin';

-- Check if the role has permissions
SELECT 
    rp.role_id,
    cr.name AS role_name,
    rp.permission,
    COUNT(*) OVER() AS total_permissions
FROM 
    public.role_permissions rp
JOIN 
    public.custom_roles cr ON rp.role_id = cr.id
WHERE 
    cr.name = 'Super Admin'
LIMIT 10;

-- Check if the user has the Super Admin role
SELECT 
    ucr.user_id,
    u.email,
    cr.name AS role_name,
    ucr.created_at
FROM 
    public.user_custom_roles ucr
JOIN 
    public.custom_roles cr ON ucr.role_id = cr.id
JOIN 
    auth.users u ON ucr.user_id = u.id
WHERE 
    u.email = 'briantest@remodl.ai';

-- Check user profile metadata
SELECT 
    u.id,
    u.email,
    up.meta
FROM 
    auth.users u
LEFT JOIN 
    public.user_profiles up ON u.id = up.user_id
WHERE 
    u.email = 'briantest@remodl.ai';

-- Test the custom_access_token_hook function with a sample event
DO $$
DECLARE
    test_user_id UUID;
    test_event jsonb;
    result jsonb;
BEGIN
    -- Get the user ID
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'briantest@remodl.ai'
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'User not found';
        RETURN;
    END IF;
    
    -- Create a test event
    test_event := jsonb_build_object(
        'user_id', test_user_id,
        'claims', jsonb_build_object(
            'sub', test_user_id,
            'email', 'briantest@remodl.ai'
        )
    );
    
    -- Call the hook function
    result := public.custom_access_token_hook(test_event);
    
    -- Display the result
    RAISE NOTICE 'Hook result: %', result;
END $$; 