# Schema Migrations Documentation

This document outlines important schema migrations that have been implemented in the Flowise application to address specific issues or add new functionality.

## User Roles Backward Compatibility Fix

### Problem
The application schema was updated to use `user_custom_roles` and `custom_roles` tables instead of the original `user_roles` table. However, many parts of the codebase still referenced the old `user_roles` table structure, causing errors when trying to access or modify role information.

### Solution
A backward compatibility layer was implemented using a SQL view and triggers to map between the old and new schema structures:

1. **View Creation**: A view named `user_roles` was created that joins the `user_custom_roles` and `custom_roles` tables to present data in the format expected by the old code.

2. **Insert Trigger**: An `INSTEAD OF INSERT` trigger was added to the view that:
   - Checks if the appropriate custom role exists
   - Creates the role if it doesn't exist
   - Inserts the user-role assignment into the `user_custom_roles` table

3. **Delete Trigger**: An `INSTEAD OF DELETE` trigger was added to the view that:
   - Finds the corresponding entries in the `user_custom_roles` table
   - Deletes the user-role assignments

### Implementation Details

```sql
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
```

### Benefits

1. **Zero Code Changes Required**: Existing code that references the `user_roles` table continues to work without modification.
2. **Transparent Operation**: The view and triggers handle the translation between old and new schema structures automatically.
3. **Gradual Migration Path**: The application can be updated to use the new schema structure over time, without requiring an immediate overhaul of all code.

### Custom Access Token Hook Update

The custom access token hook was also updated to document this change in version 4.1:

```
### v4.1 - Backward Compatibility Fix
- Added compatibility with code that references the old `user_roles` table
- Created a view and triggers to map between the new `user_custom_roles`/`custom_roles` tables and the expected `user_roles` structure
- This ensures existing code continues to work while the application is updated to use the new schema
```

### Affected Components

This fix ensures that all components that interact with user roles continue to function correctly, including:

1. API endpoints for role management
2. Authentication and authorization checks
3. UI components that display or modify user roles

### Future Considerations

While this backward compatibility layer provides an immediate solution, the long-term plan should include:

1. Gradually updating code to use the new schema structure directly
2. Adding deprecation warnings when the old `user_roles` view is accessed
3. Eventually removing the compatibility layer once all code has been updated 