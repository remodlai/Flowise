-- File Storage Permissions Migration
-- This migration adds file-related permissions to the permissions table

-- Get the File category ID
DO $$
DECLARE
  file_category_id UUID;
BEGIN
  -- Get the File category ID
  SELECT id INTO file_category_id FROM public.permission_categories WHERE name = 'File';
  
  -- If File category doesn't exist, raise an exception
  IF file_category_id IS NULL THEN
    RAISE EXCEPTION 'File permission category not found';
  END IF;
  
  -- Add file permissions
  INSERT INTO public.permissions (name, description, category_id, context_types, created_at)
  VALUES
    ('file.create', 'Permission to create files', file_category_id, ARRAY['platform', 'application', 'organization'], now()),
    ('file.read', 'Permission to read files', file_category_id, ARRAY['platform', 'application', 'organization'], now()),
    ('file.update', 'Permission to update files', file_category_id, ARRAY['platform', 'application', 'organization'], now()),
    ('file.delete', 'Permission to delete files', file_category_id, ARRAY['platform', 'application', 'organization'], now()),
    ('file.share', 'Permission to share files', file_category_id, ARRAY['platform', 'application', 'organization'], now())
  ON CONFLICT (name) DO NOTHING;
  
  -- Log the result
  RAISE NOTICE 'File permissions added successfully';
END $$; 