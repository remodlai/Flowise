-- Run the v5 custom access token hook
-- This script applies the v5 hook to Supabase Auth

-- First, load the function definition
\i v5_custom_access_token_hook.sql

-- Then, register the hook with Supabase Auth
SELECT
  supabase_functions.hooks.create_hook(
    'custom_access_token_hook',
    'custom_access_token_hook',
    'auth.jwt',
    '{"event":"jwt","phase":"transform"}'
  );

-- Verify the hook is registered
SELECT * FROM supabase_functions.hooks WHERE hook_table_id = 'auth.jwt';

-- Force a refresh of all user tokens to apply the new hook
-- Note: This is optional and can be resource-intensive in production
-- UPDATE auth.users SET updated_at = NOW(); 