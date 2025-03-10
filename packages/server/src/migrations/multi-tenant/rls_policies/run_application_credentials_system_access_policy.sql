-- run_application_credentials_system_access_policy.sql
-- Date: 2025-03-11

-- This script runs the application_credentials_system_access_policy.sql file

-- Set the search path
SET search_path TO public;

-- Run the policy file
\i 'packages/server/src/migrations/multi-tenant/rls_policies/application_credentials_system_access_policy.sql'

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'application_credentials' AND policyname = 'application_credentials_system_access_policy'; 