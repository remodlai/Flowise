-- This script provides information on how to update the frontend to display custom roles

-- First, let's see what's in the JWT token
DO $$
DECLARE
    test_user_id UUID;
    test_event jsonb;
    result jsonb;
    app_metadata jsonb;
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
    
    -- Extract app_metadata
    app_metadata := result->'claims'->'app_metadata';
    
    -- Display the app_metadata
    RAISE NOTICE 'App metadata in JWT token: %', app_metadata;
    
    -- Display custom roles specifically
    RAISE NOTICE 'Custom roles in JWT token: %', app_metadata->'custom_roles';
    
    -- Provide guidance
    RAISE NOTICE '---------------------------------------------------------------';
    RAISE NOTICE 'FRONTEND UPDATE GUIDANCE:';
    RAISE NOTICE '---------------------------------------------------------------';
    RAISE NOTICE 'To display custom roles in the frontend, you need to:';
    RAISE NOTICE '1. Extract custom_roles from the JWT token app_metadata';
    RAISE NOTICE '2. Update your UI to show both the legacy role and custom roles';
    RAISE NOTICE '';
    RAISE NOTICE 'Example TypeScript code:';
    RAISE NOTICE '```';
    RAISE NOTICE 'const session = await supabase.auth.getSession();';
    RAISE NOTICE 'const token = session?.data?.session?.access_token;';
    RAISE NOTICE 'const decodedToken = jwtDecode(token);';
    RAISE NOTICE 'const appMetadata = decodedToken?.app_metadata;';
    RAISE NOTICE 'const customRoles = appMetadata?.custom_roles || [];';
    RAISE NOTICE '';
    RAISE NOTICE '// Display in UI';
    RAISE NOTICE 'const legacyRole = decodedToken?.user_role || "user";';
    RAISE NOTICE 'const superAdminRole = customRoles.find(role => role.name === "Super Admin");';
    RAISE NOTICE 'const isAdmin = legacyRole === "admin" || superAdminRole !== undefined;';
    RAISE NOTICE '```';
    RAISE NOTICE '---------------------------------------------------------------';
END $$; 