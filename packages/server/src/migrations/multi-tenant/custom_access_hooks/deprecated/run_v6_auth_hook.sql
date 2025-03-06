-- Run script for v6 auth custom access hook
-- This script will update the auth.custom_access_token_hook function

\echo 'Updating auth.custom_access_token_hook function...'
\i v6_auth_custom_access_token_hook.sql

\echo 'Done!' 