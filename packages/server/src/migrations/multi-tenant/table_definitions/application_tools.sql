-- Create application_tools table to associate tools with applications
CREATE TABLE IF NOT EXISTS public.application_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tool_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_application_tools_application_id ON public.application_tools(application_id);
CREATE INDEX IF NOT EXISTS idx_application_tools_tool_id ON public.application_tools(tool_id);

-- Create trigger function to update application_stats when tools are associated/disassociated
CREATE OR REPLACE FUNCTION update_application_stats_on_tool_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Increment tool count for the application
        UPDATE public.application_stats
        SET 
            tool_count = tool_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For UPDATE operations that change application_id
    ELSIF TG_OP = 'UPDATE' AND OLD.application_id IS DISTINCT FROM NEW.application_id THEN
        -- Decrement count for old application
        UPDATE public.application_stats
        SET 
            tool_count = tool_count - 1,
            last_updated = now()
        WHERE application_id = OLD.application_id;
        
        -- Increment count for new application
        UPDATE public.application_stats
        SET 
            tool_count = tool_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement tool count for the application
        UPDATE public.application_stats
        SET 
            tool_count = tool_count - 1,
            last_updated = now()
        WHERE application_id = OLD.application_id;
    END IF;
    
    -- Return the appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update application_stats
CREATE TRIGGER update_stats_on_tool_change
AFTER INSERT OR UPDATE OR DELETE ON public.application_tools
FOR EACH ROW
EXECUTE FUNCTION update_application_stats_on_tool_change();

-- Create trigger to update updated_at column
CREATE TRIGGER update_application_tools_updated_at
BEFORE UPDATE ON public.application_tools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.application_tools ENABLE ROW LEVEL SECURITY;

-- Policy for platform admins (can see and modify all)
CREATE POLICY application_tools_platform_admin_policy
ON public.application_tools
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role')::text = 'platform_admin'
);

-- Policy for app admins (can see and modify their apps)
CREATE POLICY application_tools_app_admin_policy
ON public.application_tools
FOR ALL
TO authenticated
USING (
    application_id IN (
        SELECT jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'app_access')::uuid
    )
);

-- Policy for organization users (can only SELECT, not modify)
CREATE POLICY application_tools_org_user_policy
ON public.application_tools
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'org_id') IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = (auth.jwt() ->> 'org_id')::uuid
        AND o.application_id = application_tools.application_id
    )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_tools TO authenticated; 