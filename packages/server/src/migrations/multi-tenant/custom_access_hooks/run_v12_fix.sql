-- Run script for v12 permission fix
-- This script grants necessary permissions to supabase_auth_admin and updates the hook

-- Apply the permissions and updated hook
\i 'v12_fix_permissions.sql'

-- Verify the hook was updated
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'custom_access_token_hook' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Note: After running this script, users need to log out and log back in to get a new JWT with the fixed claims 