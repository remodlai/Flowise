-- Fix for missing user_roles table
-- This migration creates a view named user_roles that maps to the user_custom_roles and custom_roles tables

-- Create a view to provide backward compatibility with code that expects a user_roles table
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
    ucr.id,
    ucr.user_id,
    cr.base_role AS role,
    cr.context_type AS resource_type,
    cr.context_id AS resource_id,
    ucr.created_at
FROM 
    public.user_custom_roles ucr
JOIN 
    public.custom_roles cr ON ucr.role_id = cr.id;

-- Grant necessary permissions
GRANT SELECT ON public.user_roles TO authenticated;

-- Create a function to handle inserts to the user_roles view
CREATE OR REPLACE FUNCTION public.insert_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Find or create the appropriate custom role
    SELECT id INTO role_id
    FROM public.custom_roles
    WHERE 
        base_role = NEW.role AND
        context_type = NEW.resource_type AND
        context_id = NEW.resource_id;
        
    -- If role doesn't exist, create it
    IF role_id IS NULL THEN
        INSERT INTO public.custom_roles (
            name,
            description,
            base_role,
            context_type,
            context_id,
            created_by
        ) VALUES (
            NEW.role || ' ' || NEW.resource_type,
            'Auto-created role for ' || NEW.role || ' ' || NEW.resource_type,
            NEW.role,
            NEW.resource_type,
            NEW.resource_id,
            auth.uid()
        )
        RETURNING id INTO role_id;
    END IF;
    
    -- Insert the user-role assignment
    INSERT INTO public.user_custom_roles (
        user_id,
        role_id,
        created_by
    ) VALUES (
        NEW.user_id,
        role_id,
        auth.uid()
    );
    
    RETURN NEW;
END;
$$;

-- Create a trigger to handle inserts to the user_roles view
CREATE OR REPLACE TRIGGER insert_user_role_trigger
INSTEAD OF INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.insert_user_role();

-- Create a function to handle deletes from the user_roles view
CREATE OR REPLACE FUNCTION public.delete_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.user_custom_roles
    WHERE 
        user_id = OLD.user_id AND
        role_id IN (
            SELECT id FROM public.custom_roles
            WHERE 
                base_role = OLD.role AND
                context_type = OLD.resource_type AND
                (context_id = OLD.resource_id OR (OLD.resource_id IS NULL AND context_id IS NULL))
        );
    
    RETURN OLD;
END;
$$;

-- Create a trigger to handle deletes from the user_roles view
CREATE OR REPLACE TRIGGER delete_user_role_trigger
INSTEAD OF DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.delete_user_role(); 