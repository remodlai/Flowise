-- Create application_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.application_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(credential_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_application_credentials_application_id ON public.application_credentials(application_id);
CREATE INDEX IF NOT EXISTS idx_application_credentials_credential_id ON public.application_credentials(credential_id);

-- Create a trigger to update application_stats when credentials change
CREATE OR REPLACE FUNCTION update_application_stats_on_credential_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Increment credential count for the application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For UPDATE operations that change application_id
    ELSIF TG_OP = 'UPDATE' AND OLD.application_id IS DISTINCT FROM NEW.application_id THEN
        -- Decrement count for old application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count - 1,
            last_updated = now()
        WHERE application_id = OLD.application_id;
        
        -- Increment count for new application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement credential count for the application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count - 1,
            last_updated = now()
        WHERE application_id = OLD.application_id;
    END IF;
    
    -- Return the appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_stats_on_credential_change ON public.application_credentials;
CREATE TRIGGER update_stats_on_credential_change
AFTER INSERT OR UPDATE OR DELETE ON public.application_credentials
FOR EACH ROW
EXECUTE FUNCTION update_application_stats_on_credential_change();

-- Create trigger for updated_at
CREATE TRIGGER update_application_credentials_updated_at
BEFORE UPDATE ON public.application_credentials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up RLS policies
ALTER TABLE public.application_credentials ENABLE ROW LEVEL SECURITY;

-- Policy for platform admins (can see and modify all)
CREATE POLICY application_credentials_platform_admin_policy
ON public.application_credentials
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role')::text = 'platform_admin'
);

-- Policy for app admins (can see and modify their apps)
CREATE POLICY application_credentials_app_admin_policy
ON public.application_credentials
FOR ALL
TO authenticated
USING (
    application_id IN (
        SELECT jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'app_access')::uuid
    )
);

-- Policy for organization users (can only SELECT, not modify)
CREATE POLICY application_credentials_org_user_policy
ON public.application_credentials
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'org_id') IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = (auth.jwt() ->> 'org_id')::uuid
        AND o.application_id = application_credentials.application_id
    )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_credentials TO authenticated; 