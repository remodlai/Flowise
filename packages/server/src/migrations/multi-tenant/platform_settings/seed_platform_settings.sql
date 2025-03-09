-- Seed the platform_settings table with initial values

-- Insert the encryption key setting if it doesn't exist
INSERT INTO public.platform_settings (key, value, description, is_encrypted)
VALUES ('ENCRYPTION_KEY', 'FLOWISE_REMODL_ENCRYPTION_KEY_CHANGE_ME', 'Encryption key used for securing credentials and sensitive data', false)
ON CONFLICT (key) DO NOTHING;

-- Insert the default application ID setting if it doesn't exist
INSERT INTO public.platform_settings (key, value, description, is_encrypted)
VALUES ('DEFAULT_APPLICATION_ID', '6225eed0-f38b-41dc-81c3-322985f47b34', 'Default application ID for new users', false)
ON CONFLICT (key) DO NOTHING;

-- Insert the platform name setting if it doesn't exist
INSERT INTO public.platform_settings (key, value, description, is_encrypted)
VALUES ('PLATFORM_NAME', 'Remodl AI', 'Name of the platform', false)
ON CONFLICT (key) DO NOTHING;

-- Insert the platform version setting if it doesn't exist
INSERT INTO public.platform_settings (key, value, description, is_encrypted)
VALUES ('PLATFORM_VERSION', '1.0.0', 'Current version of the platform', false)
ON CONFLICT (key) DO NOTHING;

-- Insert the support email setting if it doesn't exist
INSERT INTO public.platform_settings (key, value, description, is_encrypted)
VALUES ('SUPPORT_EMAIL', 'support@remodl.ai', 'Email address for support inquiries', false)
ON CONFLICT (key) DO NOTHING; 