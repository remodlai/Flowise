-- Run script for v6 custom access hook
-- This script will:
-- 1. Update the custom_access_token_hook function
-- 2. Update the is_platform_admin function
-- 3. Update the RLS policy for applications

-- Step 1: Update the custom_access_token_hook function
\echo 'Updating custom_access_token_hook function...'
\i v6_custom_access_token_hook.sql

-- Step 2: Update the is_platform_admin function
\echo 'Updating is_platform_admin function...'
\i ../update_is_platform_admin_function.sql

-- Step 3: Update the RLS policy for applications
\echo 'Updating RLS policy for applications...'
\i ../update_applications_rls_policy.sql

\echo 'Done!' 