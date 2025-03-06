-- Only platform admins can manage all secrets
CREATE POLICY "Platform admins can manage all secrets" 
ON public.secrets
FOR ALL
TO authenticated
USING (authorize('platform.global'));

-- Users can access secrets they have permission for
CREATE POLICY "Users can access authorized secrets" 
ON public.secrets
FOR SELECT
TO authenticated
USING (authorize('secrets.access'));

-- Users can manage their own secrets
CREATE POLICY "Users can manage their own secrets" 
ON public.secrets
FOR ALL
TO authenticated
USING (
    metadata->>'user_id' = auth.uid()::text
);

-- Create a function to check if a user has access to a secret
CREATE OR REPLACE FUNCTION authorize_secret_access(secret_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    secret_record RECORD;
    user_id UUID;
BEGIN
    -- Get the current user ID
    user_id := auth.uid();
    
    -- If no user is authenticated, deny access
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get the secret record
    SELECT * INTO secret_record FROM public.secrets WHERE id = secret_id;
    
    -- If the secret doesn't exist, deny access
    IF secret_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If the user is the owner of the secret, allow access
    IF secret_record.metadata->>'user_id' = user_id::text THEN
        RETURN TRUE;
    END IF;
    
    -- If the user has platform.global permission, allow access
    IF authorize('platform.global') THEN
        RETURN TRUE;
    END IF;
    
    -- If the user has secrets.access permission, allow access
    IF authorize('secrets.access') THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise, deny access
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 