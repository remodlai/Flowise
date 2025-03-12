-- Add soft delete functionality and additional fields to files table
ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on is_deleted for faster filtering
CREATE INDEX IF NOT EXISTS idx_files_is_deleted ON public.files(is_deleted);

-- Update existing RLS policies to exclude deleted files
DROP POLICY IF EXISTS "Anyone can access public files" ON public.files;
CREATE POLICY "Anyone can access public files" 
ON public.files FOR SELECT
TO anon, authenticated
USING (
  (is_public = true) AND 
  (access_level = 'public'::text) AND
  (is_deleted = false)
);

DROP POLICY IF EXISTS "Users can access application files" ON public.files;
CREATE POLICY "Users can access application files" 
ON public.files FOR SELECT
TO authenticated
USING (
  (context_type = 'application'::text) AND 
  (access_level = ANY (ARRAY['shared'::text, 'public'::text])) AND 
  authorize_resource('file.read'::text, 'application'::text, context_id) AND
  (is_deleted = false)
);

DROP POLICY IF EXISTS "Users can access organization files" ON public.files;
CREATE POLICY "Users can access organization files" 
ON public.files FOR SELECT
TO authenticated
USING (
  (context_type = 'organization'::text) AND 
  (access_level = ANY (ARRAY['shared'::text, 'public'::text])) AND 
  authorize_resource('file.read'::text, 'organization'::text, context_id) AND
  (is_deleted = false)
);

DROP POLICY IF EXISTS "Users can access their own files" ON public.files;
CREATE POLICY "Users can access their own files" 
ON public.files
TO authenticated
USING (
  (created_by = auth.uid()) AND
  (is_deleted = false)
);

-- Platform admins can see all files including deleted ones
-- No change needed to "Platform admins can access all files" policy

-- Create a new policy for platform admins to restore deleted files
CREATE POLICY "Platform admins can restore deleted files" 
ON public.files
TO authenticated
USING (authorize('platform.admin'::text));

-- Create a function to soft delete files
CREATE OR REPLACE FUNCTION public.soft_delete_file(file_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.files
  SET is_deleted = TRUE
  WHERE id = file_id
  AND (
    created_by = auth.uid() OR
    authorize('platform.admin'::text) OR
    (context_type = 'application'::text AND authorize_resource('file.delete'::text, 'application'::text, context_id)) OR
    (context_type = 'organization'::text AND authorize_resource('file.delete'::text, 'organization'::text, context_id))
  );
  
  RETURN FOUND;
END;
$$;

-- Create a function to restore deleted files
CREATE OR REPLACE FUNCTION public.restore_deleted_file(file_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.files
  SET is_deleted = FALSE
  WHERE id = file_id
  AND (
    created_by = auth.uid() OR
    authorize('platform.admin'::text) OR
    (context_type = 'application'::text AND authorize_resource('file.update'::text, 'application'::text, context_id)) OR
    (context_type = 'organization'::text AND authorize_resource('file.update'::text, 'organization'::text, context_id))
  );
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.soft_delete_file TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_deleted_file TO authenticated; 