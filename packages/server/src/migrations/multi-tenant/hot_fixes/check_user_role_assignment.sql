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

-- If no results, assign the role to the user
DO $$
DECLARE
    super_admin_role_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get the super admin role ID
    SELECT id INTO super_admin_role_id
    FROM public.custom_roles
    WHERE name = 'Super Admin' AND context_type = 'platform';
    
    -- Get the admin user ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'briantest@remodl.ai'
    LIMIT 1;
    
    -- If either the role or user doesn't exist, exit
    IF super_admin_role_id IS NULL OR admin_user_id IS NULL THEN
        RAISE NOTICE 'Super Admin role or user not found';
        RETURN;
    END IF;
    
    -- Check if the assignment already exists
    IF EXISTS (
        SELECT 1 FROM public.user_custom_roles 
        WHERE user_id = admin_user_id AND role_id = super_admin_role_id
    ) THEN
        RAISE NOTICE 'User already has the Super Admin role assigned';
        RETURN;
    END IF;
    
    -- Assign the role to the user
    INSERT INTO public.user_custom_roles (
        user_id,
        role_id,
        created_by
    )
    VALUES (
        admin_user_id,
        super_admin_role_id,
        admin_user_id
    );
    
    RAISE NOTICE 'Super Admin role assigned to user with ID: %', admin_user_id;
END $$;

-- Test the hook function with the user
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
    
    -- Extract and display just the app_metadata part
    RAISE NOTICE 'App metadata: %', result->'claims'->'app_metadata';
END $$; 