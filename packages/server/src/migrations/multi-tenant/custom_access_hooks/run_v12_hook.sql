-- Run script for v12 custom access token hook
-- This script applies the v12 hook that adds userId and organizationId to JWT claims

-- Drop existing hook if it exists
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Create the new hook
\i 'v12_user_org_id_hook.sql'

-- Verify the hook was created
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'custom_access_token_hook' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Note: After running this script, you need to register the hook in the Supabase dashboard:
-- 1. Go to Authentication > Hooks
-- 2. In the "Custom Access Token" section, select the public.custom_access_token_hook function
-- 3. Click "Save"
-- 4. Log out and log back in to get a new JWT with the updated claims 