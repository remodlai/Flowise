-- Enable Row Level Security on the secrets table
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Create a policy for platform admins to access all secrets
-- This is handled by the authorize function which already checks for platform admin
CREATE POLICY "Platform admins can access all secrets"
ON public.secrets
FOR ALL
TO authenticated
USING (
  authorize('secret.view')
);

-- Create a policy for users to access secrets associated with applications they have access to
CREATE POLICY "Users can access secrets associated with their applications"
ON public.secrets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.application_credentials ac
    WHERE 
      ac.credential_id = secrets.id
      AND authorize_resource('app.view', 'application', ac.application_id)
  )
);

-- Create a policy for API keys to access secrets associated with their application
CREATE POLICY "API keys can access secrets associated with their application"
ON public.secrets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.application_credentials ac
    JOIN public.application_api_keys aak ON ac.application_id = aak.application_id
    WHERE 
      ac.credential_id = secrets.id
      AND aak.hashed_key = auth.uid()
  )
);

-- Create a policy for users with credential management permissions to manage secrets
CREATE POLICY "Users with credential management permissions can manage secrets"
ON public.secrets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.application_credentials ac
    WHERE 
      ac.credential_id = secrets.id
      AND authorize_resource('credential.manage', 'application', ac.application_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.application_credentials ac
    WHERE 
      ac.credential_id = secrets.id
      AND authorize_resource('credential.manage', 'application', ac.application_id)
  )
);

-- Create a policy for the system to access all secrets (for internal operations)
CREATE POLICY "System can access all secrets"
ON public.secrets
FOR ALL
USING (current_setting('app.is_system_operation', true)::boolean = true);

-- Create policies for the application_credentials table to ensure proper access control
ALTER TABLE public.application_credentials ENABLE ROW LEVEL SECURITY;

-- Platform admins can access all application credentials
CREATE POLICY "Platform admins can access all application credentials"
ON public.application_credentials
FOR ALL
TO authenticated
USING (
  authorize('credential.view')
);

-- Users can access application credentials for applications they have access to
CREATE POLICY "Users can access application credentials for their applications"
ON public.application_credentials
FOR SELECT
TO authenticated
USING (
  authorize_resource('app.view', 'application', application_id)
);

-- Users with credential management permissions can manage application credentials
CREATE POLICY "Users with credential management permissions can manage application credentials"
ON public.application_credentials
FOR ALL
TO authenticated
USING (
  authorize_resource('credential.manage', 'application', application_id)
)
WITH CHECK (
  authorize_resource('credential.manage', 'application', application_id)
);

-- API keys can access application credentials for their application
CREATE POLICY "API keys can access application credentials for their application"
ON public.application_credentials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.application_api_keys aak
    WHERE 
      aak.application_id = application_credentials.application_id
      AND aak.hashed_key = auth.uid()
  )
);

-- System can access all application credentials
CREATE POLICY "System can access all application credentials"
ON public.application_credentials
FOR ALL
USING (current_setting('app.is_system_operation', true)::boolean = true); 