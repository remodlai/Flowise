# Application Implementation for Remodl Platform

This document explains how applications are implemented in the Remodl Platform and their relationship with organizations.

## Overview

In the Remodl Platform, applications represent the top-level entity that organizations belong to. Each organization is associated with exactly one application, while an application can have multiple organizations.

## Data Model

The application system is built on two main tables:

1. **applications** - Stores application information
   ```sql
   CREATE TABLE public.applications (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       description TEXT,
       type TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'active',
       url TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **organizations** - Stores organization information, with each organization belonging to one application
   ```sql
   CREATE TABLE public.organizations (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       description TEXT,
       application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
       status TEXT NOT NULL DEFAULT 'active',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

## Application Settings

Each application has settings that control various aspects of its behavior:

1. **Resource Limits**
   - API call limits (daily and monthly)
   - Storage limits
   - User limits

2. **Features**
   - File uploads
   - Custom domains
   - Single Sign-On (SSO)
   - API access
   - Advanced analytics

3. **Enabled AI Models**
   - List of AI models that organizations under this application can use

These settings can be stored in a separate table or as JSON in the applications table:

```sql
CREATE TABLE public.application_settings (
    application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
    resource_limits JSONB NOT NULL DEFAULT '{
        "api_calls": {
            "daily": 10000,
            "monthly": 300000
        },
        "storage": {
            "max_gb": 50
        },
        "users": {
            "max_count": 25
        }
    }',
    features JSONB NOT NULL DEFAULT '{
        "file_uploads": true,
        "custom_domains": false,
        "sso": false,
        "api_access": true,
        "advanced_analytics": false
    }',
    enabled_models JSONB NOT NULL DEFAULT '["gpt-3.5-turbo", "gpt-4"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Application Creation Flow

1. **Platform Admin Creates Application**
   - Only platform admins can create new applications
   - The platform admin provides the application name, description, type, and URL
   - Default settings are applied to the new application

2. **Application Owner Assignment**
   - The platform admin assigns an owner to the application
   - The owner can then manage the application and its organizations

3. **Organization Creation**
   - The application owner can create organizations under the application
   - Each organization is linked to the application via the `application_id` field

## UI Implementation

The UI for applications includes:

1. **Application List View**
   - Shows all applications the user has access to
   - Platform admins see all applications
   - Application owners see only their applications

2. **Application Detail View**
   - Shows application details and settings
   - Includes tabs for:
     - Overview (general information)
     - Organizations (list of organizations under this application)
     - Settings (resource limits, features, enabled models)
     - Analytics (usage statistics)

3. **Organization Detail View**
   - Shows which application the organization belongs to
   - Includes "Application Settings" tab for managing application-specific settings for the organization

## API Endpoints

The following API endpoints are needed for application management:

1. **GET /api/applications**
   - Lists applications the user has access to
   - Filtered by user permissions

2. **GET /api/applications/:id**
   - Gets details for a specific application
   - Includes settings and basic statistics

3. **POST /api/applications**
   - Creates a new application
   - Restricted to platform admins

4. **PUT /api/applications/:id**
   - Updates an application
   - Restricted to platform admins and application owners

5. **GET /api/applications/:id/organizations**
   - Lists organizations under the application
   - Filtered by user permissions

6. **POST /api/applications/:id/organizations**
   - Creates a new organization under the application
   - Restricted to platform admins and application owners

## Permission Model

Permissions for applications follow the RBAC system:

1. **Platform Admin**
   - Can create, read, update, and delete any application
   - Can manage all settings for any application

2. **Application Owner**
   - Can read and update their own applications
   - Can manage all settings for their applications
   - Can create organizations under their applications

3. **Organization Admin**
   - Can view the application their organization belongs to
   - Cannot modify application settings directly

4. **Organization Member**
   - Can view limited information about the application their organization belongs to
   - Cannot modify application settings

## Implementation Steps

To implement the application system:

1. Create the necessary database tables (`applications`, `organizations`, `application_settings`)
2. Implement the API endpoints for application management
3. Create UI components for application management
4. Integrate with the RBAC system for permission control

## Frontend Integration

In your frontend code, you can manage applications like this:

```typescript
// Create a new application (platform admin only)
const createApplication = async (applicationData) => {
  const { data, error } = await supabase
    .from('applications')
    .insert([applicationData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Get applications the user has access to
const getApplications = async () => {
  const { data, error } = await supabase
    .from('applications')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Get organizations for an application
const getOrganizationsForApplication = async (applicationId) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('application_id', applicationId);
  
  if (error) throw error;
  return data;
};
```

## Next Steps

1. Implement application usage tracking
2. Add billing integration for applications
3. Create application templates for quick setup
4. Implement application-level analytics 