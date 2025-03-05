-- Create application_api_keys table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_api_keys') THEN
        CREATE TABLE public.application_api_keys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
            organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
            key_name TEXT NOT NULL,
            api_key TEXT NOT NULL,
            hashed_key TEXT NOT NULL,
            read_permission BOOLEAN DEFAULT TRUE,
            write_permission BOOLEAN DEFAULT FALSE,
            expires_at TIMESTAMPTZ,
            created_by UUID NOT NULL REFERENCES auth.users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            last_used_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT TRUE
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_application_api_keys_updated_at
        BEFORE UPDATE ON public.application_api_keys
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        -- Create index for faster lookups
        CREATE INDEX idx_application_api_keys_hashed_key ON public.application_api_keys(hashed_key);
        CREATE INDEX idx_application_api_keys_application_id ON public.application_api_keys(application_id);
        CREATE INDEX idx_application_api_keys_organization_id ON public.application_api_keys(organization_id);
    END IF;
END
$$;

-- Create a function to generate a secure API key
CREATE OR REPLACE FUNCTION generate_api_key() RETURNS TEXT AS $$
DECLARE
    key TEXT;
BEGIN
    -- Generate a random string for the API key (prefix with 'fwk_' for Flowise Key)
    key := 'fwk_' || encode(gen_random_bytes(24), 'base64');
    -- Replace any non-alphanumeric characters
    key := regexp_replace(key, '[^a-zA-Z0-9]', '', 'g');
    RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Create a function to hash an API key for storage
CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION generate_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION hash_api_key(TEXT) TO authenticated; 