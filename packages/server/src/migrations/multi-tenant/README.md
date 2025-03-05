# Application Credentials Implementation

This document outlines the implementation of the application_credentials feature, which associates credentials with applications in the Flowise platform.

## Database Schema

We've created a new table `application_credentials` in Supabase with the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.application_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(credential_id)
);
```

This table maintains a one-to-one relationship between credentials and applications, ensuring each credential belongs to exactly one application.

## Triggers

We've implemented a trigger to update the `application_stats` table whenever a credential is associated with or removed from an application:

```sql
CREATE OR REPLACE FUNCTION update_application_stats_on_credential_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Increment credential count for the application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For UPDATE operations that change application_id
    ELSIF TG_OP = 'UPDATE' AND OLD.application_id IS DISTINCT FROM NEW.application_id THEN
        -- Decrement count for old application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count - 1,
            last_updated = now()
        WHERE application_id = OLD.application_id;
        
        -- Increment count for new application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count + 1,
            last_updated = now()
        WHERE application_id = NEW.application_id;
    
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement credential count for the application
        UPDATE public.application_stats
        SET 
            credential_count = credential_count - 1,
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
```

We've also added a trigger to update the `updated_at` column whenever a record is updated:

```sql
CREATE TRIGGER update_application_credentials_updated_at
BEFORE UPDATE ON public.application_credentials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS) Policies

We've implemented RLS policies to ensure that only authorized users can access credential-application mappings:

```sql
-- Policy for platform admins (can see and modify all)
CREATE POLICY application_credentials_platform_admin_policy
ON public.application_credentials
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'role')::text = 'platform_admin'
);

-- Policy for app admins (can see and modify their apps)
CREATE POLICY application_credentials_app_admin_policy
ON public.application_credentials
FOR ALL
TO authenticated
USING (
    application_id IN (
        SELECT jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'app_access')::uuid
    )
);

-- Policy for organization users (can only SELECT, not modify)
CREATE POLICY application_credentials_org_user_policy
ON public.application_credentials
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'org_id') IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = (auth.jwt() ->> 'org_id')::uuid
        AND o.application_id = application_credentials.application_id
    )
);
```

These policies ensure that:
1. Platform admins can see and modify all credential-application mappings
2. App admins/members can see and modify mappings for applications they have access to
3. Organization-level users (end users) can only view (not modify) credentials associated with their organization's application

The policies use the `auth.jwt()` function to access the JWT claims of the authenticated user, following Supabase's recommended approach for custom claims and role-based access control.

## Multi-Level Access Model

Our implementation supports a multi-level access model:

1. **Platform Admins**: Have full access to all applications, credentials, and other resources across the platform
2. **App Admins/Members**: Can manage (create, update, delete) resources within their applications
3. **Organization Users**: Can use/run chatflows but cannot modify any resources. They only have read access to the resources needed to run the chatflows

This model ensures that:
- End users can use the chatflows without being able to modify the underlying configuration
- App admins can manage their applications without affecting other applications
- Platform admins have oversight and control over the entire platform

## Service Implementation

We've created a new service `applicationcredentials` that provides the following functions:

1. `getApplicationIdForCredential`: Get the application ID for a credential
2. `getCredentialIdsForApplication`: Get all credential IDs for an application
3. `associateCredentialWithApplication`: Associate a credential with an application
4. `removeCredentialAssociation`: Remove a credential's association with any application
5. `getDefaultApplicationId`: Get the default application ID (Platform Sandbox)
6. `isUserPlatformAdmin`: Check if a user is a platform admin

## Integration with Credentials Service

We've updated the credentials service to integrate with the applicationcredentials service:

1. `createCredential`: Now associates the new credential with an application (either specified or default)
2. `updateCredential`: Updates the credential's application association if applicationId is provided
3. `deleteCredentials`: Removes the credential's application association when the credential is deleted
4. `getAllCredentials`: Filters credentials by application if applicationId is provided
5. `getCredentialById`: Includes the associated application ID in the response

## Next Steps

1. Update the API controllers to accept and process applicationId in requests
2. Update the UI to display and manage credential-application associations
3. Implement similar intercept services for other entities (tools, databases, etc.)
4. Ensure that organization-level users have appropriate read-only access to all necessary resources

# Application Tools Implementation

This document outlines the implementation of the application_tools feature, which associates custom tools with applications in the Flowise platform.

## Database Schema

We've created a new table `application_tools` in Supabase with the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.application_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tool_id)
);
```

This table maintains a one-to-one relationship between tools and applications, ensuring each tool belongs to exactly one application.

## Triggers

We've implemented a trigger to update the `application_stats` table whenever a tool is associated with or removed from an application:

```sql
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
```

We've also added a trigger to update the `updated_at` column whenever a record is updated:

```sql
CREATE TRIGGER update_application_tools_updated_at
BEFORE UPDATE ON public.application_tools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS) Policies

We've implemented RLS policies to ensure that only authorized users can access tool-application mappings:

```sql
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
```

These policies ensure that:
1. Platform admins can see and modify all tool-application mappings
2. App admins/members can see and modify mappings for applications they have access to
3. Organization-level users (end users) can only view (not modify) tools associated with their organization's application

## Service Implementation

We've created a new service `applicationtools` that provides the following functions:

1. `getApplicationIdForTool`: Get the application ID for a tool
2. `getToolIdsForApplication`: Get all tool IDs for an application
3. `associateToolWithApplication`: Associate a tool with an application
4. `removeToolAssociation`: Remove a tool's association with any application
5. `getDefaultApplicationId`: Get the default application ID (Platform Sandbox)
6. `getUserApplications`: Get all applications for a user
7. `isUserPlatformAdmin`: Check if a user is a platform admin

## Integration with Tools Service

We've updated the tools service to integrate with the applicationtools service:

1. `createTool`: Now associates the new tool with an application (either specified or default)
2. `updateTool`: Updates the tool's application association if applicationId is provided
3. `deleteTool`: Removes the tool's application association when the tool is deleted
4. `getAllTools`: Filters tools by application if applicationId is provided
5. `getToolById`: Includes the associated application ID in the response
6. `importTools`: Associates imported tools with the default application

## API Updates

We've updated the tools API endpoints to handle application-specific operations:

1. `GET /tools`: Now accepts an optional `applicationId` query parameter to filter tools by application
2. `POST /tools`: Now accepts an optional `applicationId` field in the request body to associate the tool with an application
3. `PUT /tools/:id`: Now accepts an optional `applicationId` field in the request body to update the tool's application association
4. `GET /tools/:id`: Now includes the associated application ID in the response

## Next Steps

1. Update the UI to display and manage tool-application associations
2. Implement similar intercept services for other entities (databases, etc.)
3. Ensure that organization-level users have appropriate read-only access to all necessary resources 