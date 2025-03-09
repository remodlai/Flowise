-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to the table
COMMENT ON TABLE public.platform_settings IS 'Stores platform-wide settings like encryption keys and configuration values';

-- Create RLS policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy for platform admins to do everything
CREATE POLICY platform_admin_all_platform_settings
ON public.platform_settings
FOR ALL
USING (auth.jwt() ->> 'is_platform_admin' = 'true');

-- Insert the encryption key setting if it doesn't exist
INSERT INTO public.platform_settings (key, value, description, is_encrypted)
VALUES ('ENCRYPTION_KEY', 'FLOWISE_REMODL_ENCRYPTION_KEY_CHANGE_ME', 'Encryption key used for securing credentials and sensitive data', false)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;

-- Verify the table was created
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_settings'); 