-- Drop the existing policies with errors
DROP POLICY IF EXISTS "API keys can access secrets associated with their application" ON public.secrets;
DROP POLICY IF EXISTS "API keys can access application credentials for their applicati" ON public.application_credentials;

-- Create the API key policy for secrets with proper type casting
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
      AND aak.hashed_key = auth.uid()::text
  )
);

-- Create the API key policy for application_credentials with proper type casting
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
      AND aak.hashed_key = auth.uid()::text
  )
); 