-- Update superadmin role with all permissions
DO $$
DECLARE
    superadmin_role_id UUID;
    all_permissions TEXT[];
BEGIN
    -- Find the superadmin role ID
    SELECT id INTO superadmin_role_id FROM public.custom_roles WHERE name = 'superadmin';
    
    IF superadmin_role_id IS NULL THEN
        -- Create superadmin role if it doesn't exist
        INSERT INTO public.custom_roles (
            name, 
            description, 
            context_type, 
            created_by,
            permissions
        )
        VALUES (
            'superadmin', 
            'Full access to all platform features and resources', 
            'platform', 
            (SELECT id FROM auth.users LIMIT 1),
            '{}'
        )
        RETURNING id INTO superadmin_role_id;
    END IF;
    
    -- Get all available permissions
    SELECT array_agg(name) INTO all_permissions FROM public.permissions;
    
    -- Update the superadmin role with all permissions
    UPDATE public.custom_roles
    SET permissions = all_permissions
    WHERE id = superadmin_role_id;
    
    RAISE NOTICE 'Superadmin role updated with all permissions';
END $$;

-- Add fallback for when no apps or orgs exist
DO $$
DECLARE
    default_app_id UUID;
BEGIN
    -- Check if any applications exist
    IF NOT EXISTS (SELECT 1 FROM public.applications LIMIT 1) THEN
        -- Insert default application
        INSERT INTO public.applications (name, description)
        VALUES ('Default Application', 'The default application')
        RETURNING id INTO default_app_id;
        
        RAISE NOTICE 'Created default application';
        
        -- Check if any organizations exist
        IF NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1) THEN
            -- Insert default organization linked to the default application
            INSERT INTO public.organizations (name, description, application_id)
            VALUES ('Default Organization', 'The default organization', default_app_id);
            
            RAISE NOTICE 'Created default organization';
        END IF;
    ELSE
        -- If applications exist but no organizations
        IF NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1) THEN
            -- Get the first application
            SELECT id INTO default_app_id FROM public.applications LIMIT 1;
            
            -- Insert default organization linked to the first application
            INSERT INTO public.organizations (name, description, application_id)
            VALUES ('Default Organization', 'The default organization', default_app_id);
            
            RAISE NOTICE 'Created default organization linked to existing application';
        END IF;
    END IF;
END $$;

-- Add application_id column to organizations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'application_id'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN application_id UUID REFERENCES public.applications(id);
        
        RAISE NOTICE 'Added application_id column to organizations table';
    END IF;
END $$; 