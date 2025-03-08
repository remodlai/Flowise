-- File Metadata Table Migration
-- This migration enhances the files table to support multi-tenant storage

-- Check if files table exists and enhance it
DO $$
BEGIN
  -- Check if files table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'bucket') THEN
      ALTER TABLE public.files ADD COLUMN bucket TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'path') THEN
      ALTER TABLE public.files ADD COLUMN path TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'context_type') THEN
      ALTER TABLE public.files ADD COLUMN context_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'context_id') THEN
      ALTER TABLE public.files ADD COLUMN context_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'resource_type') THEN
      ALTER TABLE public.files ADD COLUMN resource_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'resource_id') THEN
      ALTER TABLE public.files ADD COLUMN resource_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'is_public') THEN
      ALTER TABLE public.files ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'access_level') THEN
      ALTER TABLE public.files ADD COLUMN access_level TEXT DEFAULT 'private';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'created_by') THEN
      ALTER TABLE public.files ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'updated_at') THEN
      ALTER TABLE public.files ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'metadata') THEN
      ALTER TABLE public.files ADD COLUMN metadata JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'virtual_path') THEN
      ALTER TABLE public.files ADD COLUMN virtual_path TEXT[];
    END IF;
    
    -- Rename content-type column to content_type if it exists (fixing the hyphen)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'content-type') THEN
      ALTER TABLE public.files RENAME COLUMN "content-type" TO content_type;
    END IF;
    
    -- Add unique constraint on bucket+path if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.conname = 'files_bucket_path_key'
      AND n.nspname = 'public'
    ) THEN
      -- Only add if both columns exist and are not null
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'bucket'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'path'
      ) THEN
        ALTER TABLE public.files ADD CONSTRAINT files_bucket_path_key UNIQUE (bucket, path);
      END IF;
    END IF;
    
    RAISE NOTICE 'Files table enhanced successfully';
  ELSE
    -- Create the files table if it doesn't exist
    CREATE TABLE public.files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      name TEXT NOT NULL,
      content_type TEXT,
      size BIGINT,
      url TEXT,
      bucket TEXT,
      path TEXT,
      
      -- Multi-tenant context
      context_type TEXT, -- 'platform', 'application', 'organization', 'user'
      context_id UUID,   -- NULL for platform context
      
      -- Resource categorization
      resource_type TEXT, -- 'chat-images', 'documents', 'avatars', etc.
      resource_id TEXT,   -- Optional reference to a specific resource
      
      -- Sharing and permissions
      is_public BOOLEAN NOT NULL DEFAULT false,
      access_level TEXT NOT NULL DEFAULT 'private', -- 'private', 'shared', 'public'
      
      -- Ownership
      created_by UUID REFERENCES auth.users(id),
      
      -- Additional metadata
      metadata JSONB,
      
      -- Virtual path for UI organization
      virtual_path TEXT[],
      
      -- Unique constraint on bucket+path
      UNIQUE(bucket, path)
    );
    
    RAISE NOTICE 'Files table created successfully';
  END IF;
  
  -- Create indexes for better performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'files' 
    AND indexname = 'idx_files_context'
  ) THEN
    CREATE INDEX idx_files_context ON public.files (context_type, context_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'files' 
    AND indexname = 'idx_files_resource'
  ) THEN
    CREATE INDEX idx_files_resource ON public.files (resource_type, resource_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'files' 
    AND indexname = 'idx_files_created_by'
  ) THEN
    CREATE INDEX idx_files_created_by ON public.files (created_by);
  END IF;
  
  -- Enable RLS on the files table
  ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'File indexes created and RLS enabled';
END $$; 