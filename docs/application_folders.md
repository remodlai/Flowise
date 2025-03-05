# Application Folders

## Overview

Application Folders provide a hierarchical organization system for content within applications. This feature allows users to create, manage, and navigate through a folder structure, making it easier to organize and access various resources.

## Database Schema

The application folders are implemented using the following database table:

```sql
CREATE TABLE IF NOT EXISTS public.application_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  parent_folder_id uuid REFERENCES public.application_folders(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Key Fields

- **id**: Unique identifier for each folder
- **application_id**: Reference to the application this folder belongs to
- **name**: Display name of the folder
- **path**: Full path of the folder (e.g., "/skills/language-models")
- **parent_folder_id**: Reference to the parent folder (null for root folders)
- **created_at**: Timestamp when the folder was created
- **updated_at**: Timestamp when the folder was last updated

## Security Model

Application folders use Row Level Security (RLS) to ensure users can only access folders for applications associated with their organization:

```sql
-- Allow authenticated users to read application folders they have access to
CREATE POLICY "Allow authenticated users to read application folders"
  ON public.application_folders
  FOR SELECT
  TO authenticated
  USING (
    application_id IN (
      -- Get applications associated with the user's organization
      SELECT application_id 
      FROM public.organizations 
      WHERE id = (auth.jwt()->>'organization_id')::uuid
    ) OR
    (auth.jwt() ->> 'user_role' = 'platform_admin')
  );

-- Allow platform admins to manage application folders
CREATE POLICY "Allow platform admins to manage application folders"
  ON public.application_folders
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');
```

This security model leverages JWT claims to efficiently determine user access rights:

1. The user's organization ID is stored in the JWT as a custom claim
2. RLS policies use this claim to filter folders based on organization access
3. Platform admins have full access to all folders

## Authentication Integration

The application folders system integrates with Supabase Auth through a custom access token hook:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_org uuid;
BEGIN
  -- Get existing claims
  claims := event->'claims';
  
  -- Get the user's organization directly from organization_users table
  SELECT organization_id 
  INTO user_org 
  FROM public.organization_users 
  WHERE user_id = (event->>'user_id')::uuid
  LIMIT 1;
  
  -- Add the organization to the claims
  IF user_org IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org));
  ELSE
    claims := jsonb_set(claims, '{organization_id}', 'null');
  END IF;
  
  -- Update the claims in the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;
```

This hook adds the user's organization ID to their JWT, which is then used by the RLS policies to determine access rights.

## Folder Hierarchy

The application folders support a hierarchical structure through the `parent_folder_id` field:

- Root folders have `parent_folder_id = null`
- Child folders reference their parent folder's ID
- The `path` field provides a human-readable representation of the folder's location

This design allows for:
- Unlimited nesting of folders
- Efficient querying of folder structures
- Cascading deletion (when a parent folder is deleted, all child folders are automatically deleted)

## API Integration

The application folders can be accessed through the API using the following endpoints:

- `GET /applications/{id}/folders` - List all folders for an application
- `POST /applications/{id}/folders` - Create a new folder
- `PUT /applications/{id}/folders/{folderId}` - Update a folder
- `DELETE /applications/{id}/folders/{folderId}` - Delete a folder

## Usage Examples

### Creating a Root Folder

```sql
INSERT INTO public.application_folders (application_id, name, path)
VALUES ('application-uuid', 'Skills', '/skills');
```

### Creating a Child Folder

```sql
INSERT INTO public.application_folders (application_id, name, path, parent_folder_id)
VALUES ('application-uuid', 'Language Models', '/skills/language-models', 'parent-folder-uuid');
```

### Querying the Folder Structure

```sql
-- Get all folders for an application
SELECT * FROM public.application_folders
WHERE application_id = 'application-uuid'
ORDER BY path;

-- Get all child folders of a specific folder
SELECT * FROM public.application_folders
WHERE parent_folder_id = 'parent-folder-uuid'
ORDER BY name;
```

## Relationship to Other Entities

Application folders are designed to organize various entities within an application. Future implementations may include:

- Associating flows with folders
- Organizing tools within folders
- Grouping chat sessions by folder
- Categorizing documents and files

This extensible design allows for a consistent organizational structure across all application resources. 