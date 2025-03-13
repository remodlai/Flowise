-- Migration: Update files table to use UUID as primary key
-- Description: Changes the primary key of the files table from integer to UUID

-- First, drop the existing primary key constraint and foreign key constraints
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_pkey;
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_created_by_fkey;

-- Drop the unique constraint on bucket and path
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_bucket_path_key;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_files_context;
DROP INDEX IF EXISTS idx_files_created_by;
DROP INDEX IF EXISTS idx_files_is_deleted;
DROP INDEX IF EXISTS idx_files_resource;

-- Rename the existing uuid column to id_uuid temporarily
ALTER TABLE public.files RENAME COLUMN uuid TO id_uuid;

-- Rename the existing id column to id_old
ALTER TABLE public.files RENAME COLUMN id TO id_old;

-- Create a new id column of type UUID
ALTER TABLE public.files ADD COLUMN id UUID DEFAULT gen_random_uuid() NOT NULL;

-- Copy values from id_uuid to id for existing records
UPDATE public.files SET id = id_uuid;

-- Drop the temporary id_uuid column
ALTER TABLE public.files DROP COLUMN id_uuid;

-- Add the primary key constraint to the new id column
ALTER TABLE public.files ADD CONSTRAINT files_pkey PRIMARY KEY (id);

-- Re-add the foreign key constraint
ALTER TABLE public.files ADD CONSTRAINT files_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Re-add the unique constraint on bucket and path
ALTER TABLE public.files ADD CONSTRAINT files_bucket_path_key UNIQUE (bucket, path);

-- Re-create the indexes
CREATE INDEX idx_files_context ON public.files(context_type, context_id);
CREATE INDEX idx_files_created_by ON public.files(created_by);
CREATE INDEX idx_files_is_deleted ON public.files(is_deleted);
CREATE INDEX idx_files_resource ON public.files(resource_type, resource_id);

-- Drop the old id column
ALTER TABLE public.files DROP COLUMN id_old;

-- Update the soft_delete_file function to use UUID
CREATE OR REPLACE FUNCTION public.soft_delete_file(file_id UUID)
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

-- Update the restore_deleted_file function to use UUID
CREATE OR REPLACE FUNCTION public.restore_deleted_file(file_id UUID)
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