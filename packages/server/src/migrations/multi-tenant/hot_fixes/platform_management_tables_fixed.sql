-- Create the UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a table to track enabled nodes
CREATE TABLE IF NOT EXISTS public.platform_enabled_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment to the table
COMMENT ON TABLE public.platform_enabled_nodes IS 'Tracks which nodes are enabled in the platform';

-- Create a table to track enabled tools
CREATE TABLE IF NOT EXISTS public.platform_enabled_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_type TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment to the table
COMMENT ON TABLE public.platform_enabled_tools IS 'Tracks which tools are enabled in the platform';

-- Enable RLS on the tables
ALTER TABLE public.platform_enabled_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_enabled_tools ENABLE ROW LEVEL SECURITY;

-- Create policies for platform_enabled_nodes

-- Anyone can read platform_enabled_nodes
CREATE POLICY "Anyone can read enabled nodes" 
ON public.platform_enabled_nodes
FOR SELECT 
TO authenticated
USING (true);

-- Only platform admins can update platform_enabled_nodes
CREATE POLICY "Platform admins can update enabled nodes" 
ON public.platform_enabled_nodes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.roles cr ON rp.role_id = cr.id
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
    JOIN public.roles cr ON rp.role_id = cr.id
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
    JOIN public.roles cr ON rp.role_id = cr.id
    WHERE rp.permission = 'platform.admin'
    AND cr.id IN (
      SELECT role_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Create policies for platform_enabled_tools

-- Anyone can read platform_enabled_tools
CREATE POLICY "Anyone can read enabled tools" 
ON public.platform_enabled_tools
FOR SELECT 
TO authenticated
USING (true);

-- Only platform admins can update platform_enabled_tools
CREATE POLICY "Platform admins can update enabled tools" 
ON public.platform_enabled_tools
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.roles cr ON rp.role_id = cr.id
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
    JOIN public.roles cr ON rp.role_id = cr.id
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
    JOIN public.roles cr ON rp.role_id = cr.id
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
  node_type_param TEXT,
  enabled_param BOOLEAN
)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the node exists
  IF EXISTS (SELECT 1 FROM public.platform_enabled_nodes WHERE node_type = node_type_param) THEN
    -- Update the existing node
    UPDATE public.platform_enabled_nodes
    SET enabled = enabled_param, updated_at = NOW()
    WHERE node_type = node_type_param;
  ELSE
    -- Insert a new node
    INSERT INTO public.platform_enabled_nodes (node_type, enabled)
    VALUES (node_type_param, enabled_param);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.toggle_node_enabled(TEXT, BOOLEAN) TO authenticated;

-- Create a function to toggle tool enabled status
CREATE OR REPLACE FUNCTION public.toggle_tool_enabled(
  tool_type_param TEXT,
  enabled_param BOOLEAN
)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the tool exists
  IF EXISTS (SELECT 1 FROM public.platform_enabled_tools WHERE tool_type = tool_type_param) THEN
    -- Update the existing tool
    UPDATE public.platform_enabled_tools
    SET enabled = enabled_param, updated_at = NOW()
    WHERE tool_type = tool_type_param;
  ELSE
    -- Insert a new tool
    INSERT INTO public.platform_enabled_tools (tool_type, enabled)
    VALUES (tool_type_param, enabled_param);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.toggle_tool_enabled(TEXT, BOOLEAN) TO authenticated; 