-- Migration: Create platform management tables
-- Description: Adds tables to control visibility of nodes and tools at the platform level

-- Check if uuid-ossp extension exists, if not create it
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for platform-enabled nodes
CREATE TABLE IF NOT EXISTS public.platform_enabled_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.platform_enabled_nodes IS 'Controls which nodes are visible/available at the platform level';

-- Create table for platform-enabled tools
CREATE TABLE IF NOT EXISTS public.platform_enabled_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_type TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.platform_enabled_tools IS 'Controls which tools are visible/available at the platform level';

-- Create RLS policies for platform_enabled_nodes
ALTER TABLE public.platform_enabled_nodes ENABLE ROW LEVEL SECURITY;

-- Only platform admins can select from platform_enabled_nodes
CREATE POLICY "Platform admins can view enabled nodes" 
ON public.platform_enabled_nodes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Only platform admins can insert into platform_enabled_nodes
CREATE POLICY "Platform admins can insert enabled nodes" 
ON public.platform_enabled_nodes
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Only platform admins can update platform_enabled_nodes
CREATE POLICY "Platform admins can update enabled nodes" 
ON public.platform_enabled_nodes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Only platform admins can delete from platform_enabled_nodes
CREATE POLICY "Platform admins can delete enabled nodes" 
ON public.platform_enabled_nodes
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Create RLS policies for platform_enabled_tools
ALTER TABLE public.platform_enabled_tools ENABLE ROW LEVEL SECURITY;

-- Only platform admins can select from platform_enabled_tools
CREATE POLICY "Platform admins can view enabled tools" 
ON public.platform_enabled_tools
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Only platform admins can insert into platform_enabled_tools
CREATE POLICY "Platform admins can insert enabled tools" 
ON public.platform_enabled_tools
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Only platform admins can update platform_enabled_tools
CREATE POLICY "Platform admins can update enabled tools" 
ON public.platform_enabled_tools
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Only platform admins can delete from platform_enabled_tools
CREATE POLICY "Platform admins can delete enabled tools" 
ON public.platform_enabled_tools
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Create a function to get all enabled nodes
CREATE OR REPLACE FUNCTION public.get_enabled_nodes()
RETURNS TABLE (node_type TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT pen.node_type
  FROM public.platform_enabled_nodes pen
  WHERE pen.enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_enabled_nodes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enabled_nodes() TO anon;

-- Create a function to get all enabled tools
CREATE OR REPLACE FUNCTION public.get_enabled_tools()
RETURNS TABLE (tool_type TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT pet.tool_type
  FROM public.platform_enabled_tools pet
  WHERE pet.enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_enabled_tools() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enabled_tools() TO anon;

-- Create a function to toggle node enabled status
CREATE OR REPLACE FUNCTION public.toggle_node_enabled(
  input_node_type TEXT,
  input_enabled BOOLEAN
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Check if the user has platform.admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied: platform.admin required';
  END IF;

  -- Insert or update the node enabled status
  INSERT INTO public.platform_enabled_nodes (node_type, enabled)
  VALUES (input_node_type, input_enabled)
  ON CONFLICT (node_type) 
  DO UPDATE SET 
    enabled = input_enabled,
    updated_at = NOW();
  
  success := FOUND;
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.toggle_node_enabled(TEXT, BOOLEAN) TO authenticated;

-- Create a function to toggle tool enabled status
CREATE OR REPLACE FUNCTION public.toggle_tool_enabled(
  input_tool_type TEXT,
  input_enabled BOOLEAN
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Check if the user has platform.admin permission
  IF NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.custom_roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied: platform.admin required';
  END IF;

  -- Insert or update the tool enabled status
  INSERT INTO public.platform_enabled_tools (tool_type, enabled)
  VALUES (input_tool_type, input_enabled)
  ON CONFLICT (tool_type) 
  DO UPDATE SET 
    enabled = input_enabled,
    updated_at = NOW();
  
  success := FOUND;
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.toggle_tool_enabled(TEXT, BOOLEAN) TO authenticated; 