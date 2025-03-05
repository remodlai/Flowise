-- Create a function to update user counts in application_stats
CREATE OR REPLACE FUNCTION update_application_stats_user_count()
RETURNS TRIGGER AS $$
DECLARE
    app_id UUID;
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Get the application_id for the organization
        SELECT application_id INTO app_id
        FROM public.organizations
        WHERE id = NEW.organization_id;
        
        -- Update user count if application_id exists
        IF app_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                user_count = user_count + 1,
                last_updated = now()
            WHERE application_id = app_id;
        END IF;
    
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Get the application_id for the organization
        SELECT application_id INTO app_id
        FROM public.organizations
        WHERE id = OLD.organization_id;
        
        -- Update user count if application_id exists
        IF app_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                user_count = user_count - 1,
                last_updated = now()
            WHERE application_id = app_id;
        END IF;
    
    -- For UPDATE operations that change organization_id
    ELSIF TG_OP = 'UPDATE' AND OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
        -- Get the application_id for the old organization
        SELECT application_id INTO app_id
        FROM public.organizations
        WHERE id = OLD.organization_id;
        
        -- Update user count for old application
        IF app_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                user_count = user_count - 1,
                last_updated = now()
            WHERE application_id = app_id;
        END IF;
        
        -- Get the application_id for the new organization
        SELECT application_id INTO app_id
        FROM public.organizations
        WHERE id = NEW.organization_id;
        
        -- Update user count for new application
        IF app_id IS NOT NULL THEN
            UPDATE public.application_stats
            SET 
                user_count = user_count + 1,
                last_updated = now()
            WHERE application_id = app_id;
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
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_stats_on_user_change'
    ) THEN
        CREATE TRIGGER update_stats_on_user_change
        AFTER INSERT OR UPDATE OR DELETE ON public.organization_users
        FOR EACH ROW
        EXECUTE FUNCTION update_application_stats_user_count();
    END IF;
END
$$;

-- Initialize user counts for existing applications
DO $$
DECLARE
    app_record RECORD;
BEGIN
    -- Loop through each application
    FOR app_record IN SELECT id FROM public.applications LOOP
        -- Update user count based on current data
        UPDATE public.application_stats
        SET 
            user_count = (
                SELECT COUNT(DISTINCT ou.user_id)
                FROM public.organization_users ou
                JOIN public.organizations o ON ou.organization_id = o.id
                WHERE o.application_id = app_record.id
            ),
            last_updated = now()
        WHERE application_id = app_record.id;
    END LOOP;
END
$$; 