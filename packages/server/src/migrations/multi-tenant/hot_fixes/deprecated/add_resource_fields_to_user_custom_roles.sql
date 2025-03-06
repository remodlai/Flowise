-- Migration to add resource_type and resource_id columns to user_custom_roles table
-- This allows us to associate roles with specific resources for fine-grained access control

DO $$
DECLARE
  resource_type_exists BOOLEAN;
  resource_id_exists BOOLEAN;
BEGIN
  -- Check if the columns already exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_custom_roles' 
    AND column_name = 'resource_type'
  ) INTO resource_type_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_custom_roles' 
    AND column_name = 'resource_id'
  ) INTO resource_id_exists;
  
  -- Add resource_type column if it doesn't exist
  IF NOT resource_type_exists THEN
    ALTER TABLE public.user_custom_roles ADD COLUMN resource_type TEXT;
    RAISE NOTICE 'Added resource_type column to user_custom_roles table';
  ELSE
    RAISE NOTICE 'resource_type column already exists in user_custom_roles table';
  END IF;
  
  -- Add resource_id column if it doesn't exist
  IF NOT resource_id_exists THEN
    ALTER TABLE public.user_custom_roles ADD COLUMN resource_id UUID;
    RAISE NOTICE 'Added resource_id column to user_custom_roles table';
  ELSE
    RAISE NOTICE 'resource_id column already exists in user_custom_roles table';
  END IF;
  
  -- Drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_custom_roles_user_id_role_id_key' 
    AND conrelid = 'public.user_custom_roles'::regclass
  ) THEN
    ALTER TABLE public.user_custom_roles DROP CONSTRAINT user_custom_roles_user_id_role_id_key;
    RAISE NOTICE 'Dropped existing unique constraint user_custom_roles_user_id_role_id_key';
  END IF;
  
  -- Create a new unique constraint that includes resource_type and resource_id
  -- Using a simpler approach to avoid syntax issues
  EXECUTE 'ALTER TABLE public.user_custom_roles 
  ADD CONSTRAINT user_custom_roles_user_id_role_id_resource_key 
  UNIQUE (user_id, role_id, resource_type, resource_id)';
  
  RAISE NOTICE 'Created new unique constraint user_custom_roles_user_id_role_id_resource_key';
  
  -- Update the existing records to set default values if needed
  -- This is a placeholder - you may want to set specific values based on your data
  -- UPDATE public.user_custom_roles SET resource_type = 'platform' WHERE resource_type IS NULL;
  
END $$;

-- Update the custom access token hook to include resource information in JWT claims
-- This will be handled in a separate migration file for the hook 