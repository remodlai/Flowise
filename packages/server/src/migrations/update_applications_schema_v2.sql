-- Update application_stats table with additional columns for metrics shown in UI
ALTER TABLE public.application_stats
ADD COLUMN IF NOT EXISTS credential_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS database_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS growth_percentage DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue_amount DECIMAL DEFAULT 0;

-- Create application_folders table for hierarchical organization of chatflows
CREATE TABLE IF NOT EXISTS public.application_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    parent_folder_id UUID REFERENCES public.application_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(application_id, path)
);

-- Add RLS policies for application_folders
ALTER TABLE public.application_folders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_folders
CREATE POLICY "Allow authenticated users to read application_folders"
  ON public.application_folders
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_folders
CREATE POLICY "Allow platform admins to manage application_folders"
  ON public.application_folders
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for application_folders
CREATE TRIGGER update_application_folders_updated_at
BEFORE UPDATE ON public.application_folders
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create application_tools table to track which tools are available to which applications
CREATE TABLE IF NOT EXISTS public.application_tools (
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (application_id, tool_id)
);

-- Add RLS policies for application_tools
ALTER TABLE public.application_tools ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_tools
CREATE POLICY "Allow authenticated users to read application_tools"
  ON public.application_tools
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_tools
CREATE POLICY "Allow platform admins to manage application_tools"
  ON public.application_tools
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for application_tools
CREATE TRIGGER update_application_tools_updated_at
BEFORE UPDATE ON public.application_tools
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create application_billing_plans table
CREATE TABLE IF NOT EXISTS public.application_billing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL,
    interval TEXT, -- 'monthly', 'yearly', etc.
    features JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for application_billing_plans
ALTER TABLE public.application_billing_plans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_billing_plans
CREATE POLICY "Allow authenticated users to read application_billing_plans"
  ON public.application_billing_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_billing_plans
CREATE POLICY "Allow platform admins to manage application_billing_plans"
  ON public.application_billing_plans
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for application_billing_plans
CREATE TRIGGER update_application_billing_plans_updated_at
BEFORE UPDATE ON public.application_billing_plans
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create application_branding table
CREATE TABLE IF NOT EXISTS public.application_branding (
    application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    custom_css TEXT,
    custom_js TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for application_branding
ALTER TABLE public.application_branding ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_branding
CREATE POLICY "Allow authenticated users to read application_branding"
  ON public.application_branding
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_branding
CREATE POLICY "Allow platform admins to manage application_branding"
  ON public.application_branding
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for application_branding
CREATE TRIGGER update_application_branding_updated_at
BEFORE UPDATE ON public.application_branding
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Add application_id to flows table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flows') THEN
        ALTER TABLE public.flows
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS folder_path TEXT;
    END IF;
END
$$;

-- Add application_id to chatmessages table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chatmessages') THEN
        ALTER TABLE public.chatmessages
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add application_id to credentials table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credentials') THEN
        ALTER TABLE public.credentials
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add application_id to files table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
        ALTER TABLE public.files
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS is_image BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Add application_id to document_stores table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_stores') THEN
        ALTER TABLE public.document_stores
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Create function to update flow count
CREATE OR REPLACE FUNCTION update_flow_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update flow count for the application
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.application_stats
        SET flow_count = (
            SELECT COUNT(*) FROM public.flows WHERE application_id = NEW.application_id
        ),
        last_updated = now()
        WHERE application_id = NEW.application_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.application_stats
        SET flow_count = (
            SELECT COUNT(*) FROM public.flows WHERE application_id = OLD.application_id
        ),
        last_updated = now()
        WHERE application_id = OLD.application_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update credential count
CREATE OR REPLACE FUNCTION update_credential_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update credential count for the application
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.application_stats
        SET credential_count = (
            SELECT COUNT(*) FROM public.credentials WHERE application_id = NEW.application_id
        ),
        last_updated = now()
        WHERE application_id = NEW.application_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.application_stats
        SET credential_count = (
            SELECT COUNT(*) FROM public.credentials WHERE application_id = OLD.application_id
        ),
        last_updated = now()
        WHERE application_id = OLD.application_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update file and image counts
CREATE OR REPLACE FUNCTION update_file_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update file and image counts for the application
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update image count
        UPDATE public.application_stats
        SET image_count = (
            SELECT COUNT(*) FROM public.files WHERE application_id = NEW.application_id AND is_image = true
        ),
        file_count = (
            SELECT COUNT(*) FROM public.files WHERE application_id = NEW.application_id AND is_image = false
        ),
        storage_used_bytes = (
            SELECT COALESCE(SUM(size), 0) FROM public.files WHERE application_id = NEW.application_id
        ),
        last_updated = now()
        WHERE application_id = NEW.application_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update image count
        UPDATE public.application_stats
        SET image_count = (
            SELECT COUNT(*) FROM public.files WHERE application_id = OLD.application_id AND is_image = true
        ),
        file_count = (
            SELECT COUNT(*) FROM public.files WHERE application_id = OLD.application_id AND is_image = false
        ),
        storage_used_bytes = (
            SELECT COALESCE(SUM(size), 0) FROM public.files WHERE application_id = OLD.application_id
        ),
        last_updated = now()
        WHERE application_id = OLD.application_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user count
CREATE OR REPLACE FUNCTION update_user_count()
RETURNS TRIGGER AS $$
DECLARE
    app_id UUID;
BEGIN
    -- Get the application_id from the organization
    SELECT application_id INTO app_id FROM public.organizations WHERE id = NEW.organization_id;
    
    -- Update user count for the application
    IF app_id IS NOT NULL THEN
        UPDATE public.application_stats
        SET user_count = (
            SELECT COUNT(DISTINCT u.id) 
            FROM public.users u
            JOIN public.organizations o ON u.organization_id = o.id
            WHERE o.application_id = app_id
        ),
        last_updated = now()
        WHERE application_id = app_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update API calls count
CREATE OR REPLACE FUNCTION update_api_calls_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update API calls count for the application
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.application_stats
        SET api_calls_count = api_calls_count + 1,
        last_updated = now()
        WHERE application_id = NEW.application_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for flows table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flows') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_flow_count_trigger ON public.flows;
        
        -- Create new trigger
        CREATE TRIGGER update_flow_count_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.flows
        FOR EACH ROW
        EXECUTE PROCEDURE update_flow_count();
    END IF;
END
$$;

-- Create triggers for credentials table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credentials') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_credential_count_trigger ON public.credentials;
        
        -- Create new trigger
        CREATE TRIGGER update_credential_count_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.credentials
        FOR EACH ROW
        EXECUTE PROCEDURE update_credential_count();
    END IF;
END
$$;

-- Create triggers for files table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_file_counts_trigger ON public.files;
        
        -- Create new trigger
        CREATE TRIGGER update_file_counts_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.files
        FOR EACH ROW
        EXECUTE PROCEDURE update_file_counts();
    END IF;
END
$$;

-- Create triggers for users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_user_count_trigger ON public.users;
        
        -- Create new trigger
        CREATE TRIGGER update_user_count_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.users
        FOR EACH ROW
        EXECUTE PROCEDURE update_user_count();
    END IF;
END
$$;

-- Create triggers for chatmessages table if it exists (for API calls tracking)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chatmessages') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_api_calls_count_trigger ON public.chatmessages;
        
        -- Create new trigger
        CREATE TRIGGER update_api_calls_count_trigger
        AFTER INSERT ON public.chatmessages
        FOR EACH ROW
        EXECUTE PROCEDURE update_api_calls_count();
    END IF;
END
$$;

-- Update existing applications to have default values for new stats columns
UPDATE public.application_stats
SET 
    credential_count = 0,
    database_count = 0,
    image_count = 0,
    file_count = 0,
    growth_percentage = 0,
    revenue_amount = 0
WHERE credential_count IS NULL;

-- Create or update the Platform Sandbox application
DO $$
DECLARE
    sandbox_app_id UUID;
BEGIN
    -- Check if Platform Sandbox application exists
    SELECT id INTO sandbox_app_id FROM public.applications WHERE name = 'Platform Sandbox' LIMIT 1;
    
    -- If it doesn't exist, create it
    IF sandbox_app_id IS NULL THEN
        -- Check if Default Application exists
        SELECT id INTO sandbox_app_id FROM public.applications WHERE name = 'Default Application' LIMIT 1;
        
        -- If Default Application exists, rename it
        IF sandbox_app_id IS NOT NULL THEN
            UPDATE public.applications
            SET name = 'Platform Sandbox',
                description = 'Default sandbox environment for platform administrators',
                type = 'sandbox',
                status = 'active',
                url = 'https://flowise.ai',
                version = '1.0.0',
                logo_url = 'https://flowise.ai/logo.png'
            WHERE id = sandbox_app_id;
        ELSE
            -- Create new Platform Sandbox application
            INSERT INTO public.applications (
                name, 
                description, 
                type, 
                status, 
                url, 
                version, 
                logo_url
            ) VALUES (
                'Platform Sandbox',
                'Default sandbox environment for platform administrators',
                'sandbox',
                'active',
                'https://flowise.ai',
                '1.0.0',
                'https://flowise.ai/logo.png'
            )
            RETURNING id INTO sandbox_app_id;
            
            -- Create default settings and stats
            INSERT INTO public.application_settings (application_id)
            VALUES (sandbox_app_id);
            
            INSERT INTO public.application_stats (application_id)
            VALUES (sandbox_app_id);
            
            -- Create default branding
            INSERT INTO public.application_branding (
                application_id,
                primary_color,
                secondary_color,
                accent_color
            ) VALUES (
                sandbox_app_id,
                '#3B82F6',
                '#1E293B',
                '#10B981'
            );
        END IF;
    END IF;
    
    -- Assign existing entities to Platform Sandbox if they don't have an application
    
    -- Assign organizations to Platform Sandbox if not already assigned
    UPDATE public.organizations o
    SET application_id = sandbox_app_id
    WHERE o.application_id IS NULL;
    
    -- If flows table exists, assign flows to Platform Sandbox if not already assigned
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flows') THEN
        UPDATE public.flows
        SET application_id = sandbox_app_id
        WHERE application_id IS NULL;
    END IF;
    
    -- If credentials table exists, assign credentials to Platform Sandbox if not already assigned
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credentials') THEN
        UPDATE public.credentials
        SET application_id = sandbox_app_id
        WHERE application_id IS NULL;
    END IF;
    
    -- If files table exists, assign files to Platform Sandbox if not already assigned
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
        UPDATE public.files
        SET application_id = sandbox_app_id
        WHERE application_id IS NULL;
    END IF;
    
    -- If chatmessages table exists, assign chatmessages to Platform Sandbox if not already assigned
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chatmessages') THEN
        UPDATE public.chatmessages
        SET application_id = sandbox_app_id
        WHERE application_id IS NULL;
    END IF;
    
    -- If document_stores table exists, assign document_stores to Platform Sandbox if not already assigned
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_stores') THEN
        UPDATE public.document_stores
        SET application_id = sandbox_app_id
        WHERE application_id IS NULL;
    END IF;
    
    -- Create root folder for Platform Sandbox
    INSERT INTO public.application_folders (
        application_id,
        name,
        path,
        parent_folder_id
    ) VALUES (
        sandbox_app_id,
        'Root',
        '/',
        NULL
    ) ON CONFLICT DO NOTHING;
END
$$; 