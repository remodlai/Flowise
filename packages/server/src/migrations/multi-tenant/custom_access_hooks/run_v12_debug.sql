-- Run script for v12 debug hook
-- This script applies a debug version of the hook that adds detailed information about the organization lookup process

-- Apply the debug hook
\i 'v12_debug_hook.sql'

-- Verify the hook was updated
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'custom_access_token_hook' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Note: After running this script, users need to log out and log back in to get a new JWT with the debug information 