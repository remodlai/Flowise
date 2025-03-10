-- application_credentials_system_access_policy.sql
-- Date: 2025-03-11

-- Description: This policy allows access to application_credentials when an application_id is present,
-- regardless of user authentication. This is necessary for system operations that need to access
-- credentials for an application.

-- First, let's check if the policy already exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'application_credentials' 
        AND policyname = 'application_credentials_system_access_policy'
    ) THEN
        DROP POLICY application_credentials_system_access_policy ON application_credentials;
    END IF;
END
$$;

-- Create the new policy
CREATE POLICY application_credentials_system_access_policy ON application_credentials
FOR ALL
USING (application_id IS NOT NULL)
WITH CHECK (application_id IS NOT NULL);

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'Created application_credentials_system_access_policy';
END
$$; 