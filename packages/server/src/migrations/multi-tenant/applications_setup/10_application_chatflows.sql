-- Create application_chatflows table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_chatflows') THEN
        CREATE TABLE public.application_chatflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
            chatflow_id UUID NOT NULL,
            folder_path TEXT DEFAULT '/',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(chatflow_id)
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_application_chatflows_updated_at
        BEFORE UPDATE ON public.application_chatflows
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
        -- Create indexes for faster lookups
        CREATE INDEX idx_application_chatflows_application_id ON public.application_chatflows(application_id);
        CREATE INDEX idx_application_chatflows_chatflow_id ON public.application_chatflows(chatflow_id);
    END IF;
END
$$;

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

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_stats_on_chatflow_change'
    ) THEN
        CREATE TRIGGER update_stats_on_chatflow_change
        AFTER INSERT OR UPDATE OR DELETE ON public.application_chatflows
        FOR EACH ROW
        EXECUTE FUNCTION update_application_stats_on_chatflow_change();
    END IF;
END
$$;

-- Create RLS policies for application_chatflows
ALTER TABLE public.application_chatflows ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all chatflows
CREATE POLICY "Platform admins can manage all chatflows"
ON public.application_chatflows
USING (is_platform_admin());

-- Users can manage chatflows for applications they have access to
CREATE POLICY "Users can manage chatflows for their applications"
ON public.application_chatflows
USING (user_has_application_access(application_id));

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_chatflows TO authenticated; 