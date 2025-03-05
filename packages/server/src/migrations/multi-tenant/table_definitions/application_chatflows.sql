-- Create application_chatflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.application_chatflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    chatflow_id UUID NOT NULL,
    folder_path TEXT DEFAULT '/',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(chatflow_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_application_chatflows_application_id ON public.application_chatflows(application_id);
CREATE INDEX IF NOT EXISTS idx_application_chatflows_chatflow_id ON public.application_chatflows(chatflow_id);

-- Create a trigger to update application_stats when chatflows change
CREATE OR REPLACE FUNCTION update_application_stats_on_chatflow_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Increment flow count for the application
        UPDATE public.application_stats
        SET 
            flow_count = flow_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For UPDATE operations that change application_id
    ELSIF TG_OP = 'UPDATE' AND OLD.application_id IS DISTINCT FROM NEW.application_id THEN
        -- Decrement count for old application
        UPDATE public.application_stats
        SET 
            flow_count = flow_count - 1,
            last_updated = now()
        WHERE application_id = OLD.application_id;
        
        -- Increment count for new application
        UPDATE public.application_stats
        SET 
            flow_count = flow_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement flow count for the application
        UPDATE public.application_stats
        SET 
            flow_count = flow_count - 1,
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

-- Create the trigger
DROP TRIGGER IF EXISTS update_stats_on_chatflow_change ON public.application_chatflows;
CREATE TRIGGER update_stats_on_chatflow_change
AFTER INSERT OR UPDATE OR DELETE ON public.application_chatflows
FOR EACH ROW
EXECUTE FUNCTION update_application_stats_on_chatflow_change();

-- Set up RLS policies
ALTER TABLE public.application_chatflows ENABLE ROW LEVEL SECURITY;

-- Policy for platform admins (can see all)
CREATE POLICY application_chatflows_platform_admin_policy
ON public.application_chatflows
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        WHERE ucr.user_id = auth.uid()
        AND cr.name = 'platform_admin'
    )
);

-- Policy for app admins (can see their apps)
CREATE POLICY application_chatflows_app_admin_policy
ON public.application_chatflows
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        WHERE ucr.user_id = auth.uid()
        AND ucr.resource_id = application_id
        AND ucr.resource_type = 'application'
        AND cr.name IN ('app_admin', 'app_member')
    )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_chatflows TO authenticated; 