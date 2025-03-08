-- File Helper Functions Migration
-- This migration adds helper functions for file access control

-- Function to check if a user has access to a file
CREATE OR REPLACE FUNCTION public.user_has_file_access(file_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get the file record
  SELECT * INTO file_record FROM public.files WHERE id = file_id;
  
  -- If file doesn't exist, return false
  IF file_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is platform admin
  IF public.authorize('platform.admin') THEN
    RETURN true;
  END IF;
  
  -- Check if user owns the file
  IF file_record.created_by = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Check if file is public
  IF file_record.is_public AND file_record.access_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- Check if file is shared with user's organization
  IF file_record.context_type = 'organization' AND file_record.access_level IN ('shared', 'public') THEN
    RETURN public.authorize_resource('file.read', 'organization', file_record.context_id);
  END IF;
  
  -- Check if file is shared with user's application
  IF file_record.context_type = 'application' AND file_record.access_level IN ('shared', 'public') THEN
    RETURN public.authorize_resource('file.read', 'application', file_record.context_id);
  END IF;
  
  -- Default to no access
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 