-- Ensure organizations table has application_id field
DO $$
BEGIN
    -- Check if application_id column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'application_id'
    ) THEN
        -- Add application_id column
        ALTER TABLE public.organizations
        ADD COLUMN application_id UUID REFERENCES public.applications(id);
    END IF;
END
$$;

-- Create a trigger to update application_stats when organizations change
CREATE OR REPLACE FUNCTION update_application_stats_on_organization_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Increment organization count for the application
        UPDATE public.application_stats
        SET 
            organization_count = organization_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For UPDATE operations that change application_id
    ELSIF TG_OP = 'UPDATE' AND OLD.application_id IS DISTINCT FROM NEW.application_id THEN
        -- Decrement count for old application
        IF OLD.application_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                organization_count = organization_count - 1,
                last_updated = now()
            WHERE application_id = OLD.application_id;
        END IF;
        
        -- Increment count for new application
        IF NEW.application_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                organization_count = organization_count + 1,
                last_updated = now()
            WHERE application_id = NEW.application_id;
        END IF;
    
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement organization count for the application
        IF OLD.application_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                organization_count = organization_count - 1,
                last_updated = now()
            WHERE application_id = OLD.application_id;
        END IF;
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
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_stats_on_organization_change'
    ) THEN
        CREATE TRIGGER update_stats_on_organization_change
        AFTER INSERT OR UPDATE OR DELETE ON public.organizations
        FOR EACH ROW
        EXECUTE FUNCTION update_application_stats_on_organization_change();
    END IF;
END
$$;

-- Associate existing organizations with the Platform Sandbox application
DO $$
DECLARE
    sandbox_app_id UUID;
BEGIN
    -- Get the Platform Sandbox application ID
    SELECT id INTO sandbox_app_id FROM public.applications WHERE name = 'Platform Sandbox';
    
    -- Only proceed if we found the application
    IF sandbox_app_id IS NOT NULL THEN
        -- Update organizations that don't have an application_id
        UPDATE public.organizations
        SET application_id = sandbox_app_id
        WHERE application_id IS NULL;
    END IF;
END
$$; 