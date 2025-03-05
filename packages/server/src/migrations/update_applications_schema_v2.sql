-- Create application_stats table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_stats') THEN
        CREATE TABLE public.application_stats (
            application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
            organization_count INTEGER DEFAULT 0,
            user_count INTEGER DEFAULT 0,
            flow_count INTEGER DEFAULT 0,
            credential_count INTEGER DEFAULT 0,
            database_count INTEGER DEFAULT 0,
            image_count INTEGER DEFAULT 0,
            file_count INTEGER DEFAULT 0,
            api_calls_count INTEGER DEFAULT 0,
            storage_used_bytes BIGINT DEFAULT 0,
            growth_percentage DECIMAL DEFAULT 0,
            revenue_amount DECIMAL DEFAULT 0,
            run_count INTEGER DEFAULT 0,
            last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    ELSE
        -- If table exists, add columns if they don't exist
        ALTER TABLE public.application_stats
        ADD COLUMN IF NOT EXISTS credential_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS database_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS growth_percentage DECIMAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS revenue_amount DECIMAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Create files table if it doesn't exist to track files in Supabase storage
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
        CREATE TABLE public.files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
            organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            bucket_name TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size BIGINT NOT NULL,
            is_image BOOLEAN DEFAULT false,
            is_public BOOLEAN DEFAULT false,
            public_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        -- Add RLS policies for files table
        ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read their own files or files they have access to
        CREATE POLICY "Allow users to read their own files or files they have access to"
            ON public.files
            FOR SELECT
            TO authenticated
            USING (
                user_id = auth.uid() OR
                organization_id IN (
                    SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
                ) OR
                (auth.jwt() ->> 'user_role' = 'platform_admin')
            );
            
        -- Allow users to insert their own files
        CREATE POLICY "Allow users to insert their own files"
            ON public.files
            FOR INSERT
            TO authenticated
            WITH CHECK (
                user_id = auth.uid() OR
                organization_id IN (
                    SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
                ) OR
                (auth.jwt() ->> 'user_role' = 'platform_admin')
            );
            
        -- Allow users to update their own files
        CREATE POLICY "Allow users to update their own files"
            ON public.files
            FOR UPDATE
            TO authenticated
            USING (
                user_id = auth.uid() OR
                organization_id IN (
                    SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
                ) OR
                (auth.jwt() ->> 'user_role' = 'platform_admin')
            );
            
        -- Allow users to delete their own files
        CREATE POLICY "Allow users to delete their own files"
            ON public.files
            FOR DELETE
            TO authenticated
            USING (
                user_id = auth.uid() OR
                organization_id IN (
                    SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
                ) OR
                (auth.jwt() ->> 'user_role' = 'platform_admin')
            );
            
        -- Create trigger to update the updated_at column
        CREATE TRIGGER update_files_updated_at
        BEFORE UPDATE ON public.files
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    ELSE
        -- If files table exists but doesn't have these columns, add them
        ALTER TABLE public.files
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS bucket_name TEXT,
        ADD COLUMN IF NOT EXISTS storage_path TEXT,
        ADD COLUMN IF NOT EXISTS is_image BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS public_url TEXT;
    END IF;
END
$$;

-- Drop and recreate application_settings table with flattened structure
DROP TABLE IF EXISTS public.application_settings CASCADE;

CREATE TABLE IF NOT EXISTS public.application_settings (
    application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
    -- Resource limits - flattened from JSONB
    api_calls_daily_limit INTEGER DEFAULT 10000,
    api_calls_monthly_limit INTEGER DEFAULT 300000,
    storage_max_gb INTEGER DEFAULT 50,
    users_max_count INTEGER DEFAULT 25,
    -- Features - flattened from JSONB
    file_uploads_enabled BOOLEAN DEFAULT true,
    custom_domains_enabled BOOLEAN DEFAULT false,
    sso_enabled BOOLEAN DEFAULT false,
    api_access_enabled BOOLEAN DEFAULT true,
    advanced_analytics_enabled BOOLEAN DEFAULT false,
    -- Enabled models - stored as array instead of JSONB
    enabled_models TEXT[] DEFAULT ARRAY['gpt-3.5-turbo', 'gpt-4'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for application_settings
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_settings
CREATE POLICY "Allow authenticated users to read application_settings"
  ON public.application_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_settings
CREATE POLICY "Allow platform admins to manage application_settings"
  ON public.application_settings
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for application_settings
CREATE TRIGGER update_application_settings_updated_at
BEFORE UPDATE ON public.application_settings
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

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

-- Create application_billing_plans table with flattened structure
DROP TABLE IF EXISTS public.application_billing_plans CASCADE;

CREATE TABLE IF NOT EXISTS public.application_billing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL,
    interval TEXT, -- 'monthly', 'yearly', etc.
    -- Flattened features
    feature_api_access BOOLEAN DEFAULT true,
    feature_custom_domain BOOLEAN DEFAULT false,
    feature_priority_support BOOLEAN DEFAULT false,
    feature_advanced_analytics BOOLEAN DEFAULT false,
    feature_unlimited_users BOOLEAN DEFAULT false,
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

-- Create application_api_keys table with flattened structure
DROP TABLE IF EXISTS public.application_api_keys CASCADE;

CREATE TABLE IF NOT EXISTS public.application_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    hashed_key TEXT NOT NULL,
    -- Flattened permissions
    read_permission BOOLEAN DEFAULT true,
    write_permission BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Add RLS policies for application_api_keys
ALTER TABLE public.application_api_keys ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own API keys
CREATE POLICY "Allow authenticated users to read their own API keys"
  ON public.application_api_keys
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    (organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )) OR
    (auth.jwt() ->> 'user_role' = 'platform_admin')
  );

-- Allow platform admins to manage API keys
CREATE POLICY "Allow platform admins to manage API keys"
  ON public.application_api_keys
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for application_api_keys
CREATE TRIGGER update_application_api_keys_updated_at
BEFORE UPDATE ON public.application_api_keys
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create chat_sessions table with simplified metadata
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    chat_id UUID NOT NULL UNIQUE,
    flow_id UUID,
    title TEXT,
    -- Common metadata fields flattened
    source TEXT, -- 'web', 'api', 'mobile'
    is_pinned BOOLEAN DEFAULT false,
    message_count INTEGER DEFAULT 0,
    last_message_content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own chat sessions
CREATE POLICY "Allow authenticated users to read their own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )) OR
    (auth.jwt() ->> 'user_role' = 'platform_admin')
  );

-- Allow platform admins to manage chat sessions
CREATE POLICY "Allow platform admins to manage chat sessions"
  ON public.chat_sessions
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create flow_runs table with simplified structure
CREATE TABLE IF NOT EXISTS public.flow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    flow_id UUID,
    chat_id UUID,
    status TEXT NOT NULL, -- 'success', 'error', 'running'
    error TEXT,
    duration_ms INTEGER,
    -- Input/output as text instead of JSONB for simpler storage
    input_text TEXT,
    output_text TEXT,
    -- Common metadata fields flattened
    source TEXT, -- 'web', 'api', 'mobile'
    model_name TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies for flow_runs
ALTER TABLE public.flow_runs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own flow runs
CREATE POLICY "Allow authenticated users to read their own flow runs"
  ON public.flow_runs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )) OR
    (auth.jwt() ->> 'user_role' = 'platform_admin')
  );

-- Allow platform admins to manage flow runs
CREATE POLICY "Allow platform admins to manage flow runs"
  ON public.flow_runs
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create trigger to update the updated_at column for flow_runs
CREATE TRIGGER update_flow_runs_updated_at
BEFORE UPDATE ON public.flow_runs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create function to update run count
CREATE OR REPLACE FUNCTION update_run_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update run count for the application
    IF TG_OP = 'INSERT' THEN
        UPDATE public.application_stats
        SET run_count = run_count + 1,
        last_updated = now()
        WHERE application_id = NEW.application_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for flow_runs
CREATE TRIGGER update_run_count_trigger
AFTER INSERT ON public.flow_runs
FOR EACH ROW
EXECUTE PROCEDURE update_run_count();

-- Add application_id to flows table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flows') THEN
        ALTER TABLE public.flows
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS folder_path TEXT,
        ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS previous_versions JSONB;
    END IF;
END
$$;

-- Add application_id to chatmessages table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chatmessages') THEN
        ALTER TABLE public.chatmessages
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS user_id UUID;
    END IF;
END
$$;

-- Add application_id to credentials table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credentials') THEN
        ALTER TABLE public.credentials
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add application_id to files table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
        ALTER TABLE public.files
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS is_image BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Add application_id to document_stores table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_stores') THEN
        ALTER TABLE public.document_stores
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Add application_id to apikeys table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apikeys') THEN
        ALTER TABLE public.apikeys
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
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
            SELECT COUNT(*) FROM public.files 
            WHERE application_id = NEW.application_id AND is_image = true
        ),
        file_count = (
            SELECT COUNT(*) FROM public.files 
            WHERE application_id = NEW.application_id AND is_image = false
        ),
        storage_used_bytes = (
            SELECT COALESCE(SUM(size), 0) FROM public.files 
            WHERE application_id = NEW.application_id
        ),
        last_updated = now()
        WHERE application_id = NEW.application_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update image count
        UPDATE public.application_stats
        SET image_count = (
            SELECT COUNT(*) FROM public.files 
            WHERE application_id = OLD.application_id AND is_image = true
        ),
        file_count = (
            SELECT COUNT(*) FROM public.files 
            WHERE application_id = OLD.application_id AND is_image = false
        ),
        storage_used_bytes = (
            SELECT COALESCE(SUM(size), 0) FROM public.files 
            WHERE application_id = OLD.application_id
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
    revenue_amount = 0,
    run_count = 0
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
            
            -- Create default settings with flattened structure
            INSERT INTO public.application_settings (
                application_id,
                api_calls_daily_limit,
                api_calls_monthly_limit,
                storage_max_gb,
                users_max_count,
                file_uploads_enabled,
                custom_domains_enabled,
                sso_enabled,
                api_access_enabled,
                advanced_analytics_enabled,
                enabled_models
            ) VALUES (
                sandbox_app_id,
                10000,
                300000,
                50,
                25,
                true,
                false,
                false,
                true,
                false,
                ARRAY['gpt-3.5-turbo', 'gpt-4']
            );
            
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
    
    -- If apikeys table exists, assign apikeys to Platform Sandbox if not already assigned
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apikeys') THEN
        UPDATE public.apikeys
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

-- Create function to sync Supabase storage objects with files table
CREATE OR REPLACE FUNCTION sync_storage_object()
RETURNS TRIGGER AS $$
DECLARE
    app_id UUID;
    org_id UUID;
    user_id UUID;
    file_size BIGINT;
    is_img BOOLEAN;
    mime VARCHAR;
    pub_url TEXT;
BEGIN
    -- Extract application_id, organization_id, and user_id from the storage path
    -- Format is typically: {level}/{id}/...
    -- Where level is 'app', 'org', or 'user'
    
    -- Extract the first part of the path (app, org, user)
    IF storage.foldername(NEW.name) LIKE 'app/%' THEN
        -- Extract app_id from path (app/{app_id}/...)
        app_id := (SELECT id FROM public.applications 
                  WHERE id::text = split_part(storage.foldername(NEW.name), '/', 2));
    ELSIF storage.foldername(NEW.name) LIKE 'org/%' THEN
        -- Extract org_id from path (org/{org_id}/...)
        org_id := (SELECT id FROM public.organizations 
                  WHERE id::text = split_part(storage.foldername(NEW.name), '/', 2));
        -- Get app_id from organization
        app_id := (SELECT application_id FROM public.organizations WHERE id = org_id);
    ELSIF storage.foldername(NEW.name) LIKE 'user/%' THEN
        -- Extract user_id from path (user/{user_id}/...)
        user_id := (SELECT id FROM auth.users 
                   WHERE id::text = split_part(storage.foldername(NEW.name), '/', 2));
        -- Get org_id from user's primary organization
        org_id := (SELECT organization_id FROM public.organization_users 
                  WHERE user_id = user_id AND is_primary = true LIMIT 1);
        -- Get app_id from organization
        IF org_id IS NOT NULL THEN
            app_id := (SELECT application_id FROM public.organizations WHERE id = org_id);
        END IF;
    END IF;
    
    -- Determine if it's an image based on metadata or file extension
    mime := NEW.metadata->>'mimetype';
    is_img := mime LIKE 'image/%';
    
    -- Get file size from metadata
    file_size := (NEW.metadata->>'size')::BIGINT;
    
    -- Get public URL if the bucket is public
    IF NEW.bucket_id = 'public' THEN
        pub_url := storage.generate_public_url(NEW.bucket_id, NEW.name);
    END IF;
    
    -- Insert or update the file record
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.files (
            application_id, organization_id, user_id, 
            bucket_name, storage_path, file_name, 
            mime_type, size, is_image, is_public, public_url
        ) VALUES (
            app_id, org_id, user_id,
            NEW.bucket_id, storage.foldername(NEW.name), storage.filename(NEW.name),
            mime, file_size, is_img, (NEW.bucket_id = 'public'), pub_url
        );
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.files
        SET application_id = app_id,
            organization_id = org_id,
            user_id = user_id,
            bucket_name = NEW.bucket_id,
            storage_path = storage.foldername(NEW.name),
            file_name = storage.filename(NEW.name),
            mime_type = mime,
            size = file_size,
            is_image = is_img,
            is_public = (NEW.bucket_id = 'public'),
            public_url = pub_url,
            updated_at = now()
        WHERE bucket_name = OLD.bucket_id AND storage_path || '/' || file_name = OLD.name;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle storage object deletion
CREATE OR REPLACE FUNCTION handle_storage_object_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the corresponding record from the files table
    DELETE FROM public.files
    WHERE bucket_name = OLD.bucket_id AND storage_path || '/' || file_name = OLD.name;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for storage.objects table
DO $$
BEGIN
    -- Create trigger for INSERT operations
    DROP TRIGGER IF EXISTS sync_storage_object_insert ON storage.objects;
    CREATE TRIGGER sync_storage_object_insert
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE PROCEDURE sync_storage_object();
    
    -- Create trigger for UPDATE operations
    DROP TRIGGER IF EXISTS sync_storage_object_update ON storage.objects;
    CREATE TRIGGER sync_storage_object_update
    AFTER UPDATE ON storage.objects
    FOR EACH ROW
    EXECUTE PROCEDURE sync_storage_object();
    
    -- Create trigger for DELETE operations
    DROP TRIGGER IF EXISTS handle_storage_object_delete ON storage.objects;
    CREATE TRIGGER handle_storage_object_delete
    AFTER DELETE ON storage.objects
    FOR EACH ROW
    EXECUTE PROCEDURE handle_storage_object_delete();
END
$$; 