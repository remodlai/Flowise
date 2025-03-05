# Application Schema Documentation

## Overview
This document outlines what an Application represents in the Flowise system, what metrics we're tracking, and how Applications relate to other entities in the system. It aligns the UI implementation with the database schema.

## Application Entity

Based on the current UI implementation, an Application represents a top-level container that can have multiple organizations, users, flows, and resources associated with it.

### Core Properties (applications table)
- **id**: Unique identifier for the application
- **name**: Display name of the application
- **description**: Detailed description of what the application does
- **logo_url**: URL to the application's logo image
- **url**: URL to the application's website
- **version**: Version number of the application (e.g., "1.0.0")
- **type**: Type of application (e.g., "standard")
- **status**: Current status of the application (e.g., "active", "inactive", "production")
- **created_at**: When the application was created
- **updated_at**: When the application was last updated

### Application Settings (application_settings table)
- **api_calls_daily_limit**: Maximum number of API calls allowed per day (default: 10000)
- **api_calls_monthly_limit**: Maximum number of API calls allowed per month (default: 300000)
- **storage_max_gb**: Maximum storage allowed in GB (default: 50)
- **users_max_count**: Maximum number of users allowed (default: 25)
- **file_uploads_enabled**: Whether file uploads are enabled (default: true)
- **custom_domains_enabled**: Whether custom domains are enabled (default: false)
- **sso_enabled**: Whether SSO is enabled (default: false)
- **api_access_enabled**: Whether API access is enabled (default: true)
- **advanced_analytics_enabled**: Whether advanced analytics are enabled (default: false)
- **enabled_models**: Array of enabled AI models (default: ['gpt-3.5-turbo', 'gpt-4'])
- **created_at**: When the settings were created
- **updated_at**: When the settings were last updated

### Application Stats (application_stats table)
- **organization_count**: Number of organizations in the application
- **user_count**: Number of users across all organizations
- **flow_count**: Number of flows in the application
- **credential_count**: Number of credentials in the application
- **database_count**: Number of databases in the application
- **image_count**: Number of images in the application
- **file_count**: Number of files (non-images) in the application
- **api_calls_count**: Number of API calls made
- **storage_used_bytes**: Total storage used in bytes
- **growth_percentage**: Percentage growth in usage
- **revenue_amount**: Revenue or usage cost
- **run_count**: Number of flow runs
- **last_updated**: When the stats were last updated

### Application Billing Plans (application_billing_plans table)
- **id**: Unique identifier for the billing plan
- **application_id**: ID of the application this plan belongs to
- **name**: Name of the billing plan (e.g., "Basic", "Premium", "Enterprise")
- **description**: Description of what the plan offers
- **price**: Price of the plan
- **interval**: Billing interval (e.g., "monthly", "yearly")
- **feature_api_access**: Whether API access is included
- **feature_custom_domain**: Whether custom domains are included
- **feature_priority_support**: Whether priority support is included
- **feature_advanced_analytics**: Whether advanced analytics are included
- **feature_unlimited_users**: Whether unlimited users are included
- **is_default**: Whether this is the default plan
- **created_at**: When the plan was created
- **updated_at**: When the plan was last updated

### Application API Keys (application_api_keys table)
- **id**: Unique identifier for the API key
- **application_id**: ID of the application this key belongs to
- **organization_id**: Optional ID of the organization this key belongs to
- **key_name**: Display name for the key
- **api_key**: The actual API key (encrypted)
- **hashed_key**: Hashed version of the API key for verification
- **read_permission**: Whether the key has read permission
- **write_permission**: Whether the key has write permission
- **expires_at**: When the key expires (optional)
- **created_by**: User ID of who created the key
- **created_at**: When the key was created
- **updated_at**: When the key was last updated
- **last_used_at**: When the key was last used
- **is_active**: Whether the key is active

### Chat Sessions (chat_sessions table)
- **id**: Unique identifier for the session
- **application_id**: ID of the application this session belongs to
- **organization_id**: Optional ID of the organization this session belongs to
- **user_id**: Optional ID of the user who owns the session
- **chat_id**: Unique identifier for the chat (used in frontend)
- **flow_id**: Optional ID of the flow associated with this session
- **title**: Title of the chat session
- **source**: Source of the chat session (e.g., "web", "api", "mobile")
- **is_pinned**: Whether the session is pinned
- **message_count**: Number of messages in the session
- **last_message_content**: Content of the last message in the session
- **created_at**: When the session was created
- **updated_at**: When the session was last updated
- **last_message_at**: When the last message was sent

### Flow Runs (flow_runs table)
- **id**: Unique identifier for the run
- **application_id**: ID of the application this run belongs to
- **organization_id**: Optional ID of the organization this run belongs to
- **user_id**: Optional ID of the user who initiated the run
- **flow_id**: ID of the flow that was run
- **chat_id**: Optional ID of the chat session this run belongs to
- **status**: Status of the run (e.g., "success", "error", "running")
- **error**: Error message if the run failed
- **duration_ms**: Duration of the run in milliseconds
- **input_text**: Input text for the run
- **output_text**: Output text from the run
- **source**: Source of the run (e.g., "web", "api", "mobile")
- **model_name**: Name of the model used in the run
- **tokens_used**: Number of tokens used in the run
- **created_at**: When the run was created
- **updated_at**: When the run was last updated

## UI Metrics vs Database Schema

### Main Metrics (Displayed as larger cards in UI)
1. **Agent Flows**: Maps to `flow_count` in application_stats
2. **Credentials**: Not currently tracked in the schema, needs to be added
3. **Databases**: Not currently tracked in the schema, needs to be added

### Secondary Metrics (Displayed as smaller cards in UI)
1. **Organizations**: Maps to `organization_count` in application_stats
2. **Users**: Maps to `user_count` in application_stats
3. **Total Image Storage**: Not specifically tracked, part of `storage_used_bytes`
4. **Total File Storage**: Not specifically tracked, part of `storage_used_bytes`
5. **Images**: Count not tracked separately
6. **Files**: Count not tracked separately

### Growth Metrics
- Percentage growth in usage: Not currently tracked
- Revenue or usage cost: Not currently tracked

## Relationships
- **Application** → **Organizations**: One-to-many (via `application_id` in organizations table)
- **Organizations** → **Users**: One-to-many (existing relationship)
- **Application** → **Flows**: One-to-many (relationship needs to be established)
- **Application** → **Credentials**: One-to-many (relationship needs to be established)
- **Application** → **Databases**: One-to-many (relationship needs to be established)
- **Application** → **Files/Images**: One-to-many (via `application_id` in files table)

## Storage Implementation

The application uses Supabase Storage for file storage, with the following buckets:

1. **PUBLIC**: For publicly accessible files
2. **PROFILES**: For user profile pictures
3. **PLATFORM**: For platform-level files
4. **APPS**: For application-specific files
5. **ORGANIZATIONS**: For organization-specific files
6. **USER_FILES**: For user-specific files

Files are tracked in the `files` table, which includes:
- **id**: Unique identifier for the file
- **application_id**: ID of the application this file belongs to
- **organization_id**: Optional ID of the organization this file belongs to
- **user_id**: Optional ID of the user who owns the file
- **bucket_name**: Name of the Supabase storage bucket
- **storage_path**: Path within the bucket
- **file_name**: Name of the file
- **mime_type**: MIME type of the file
- **size**: Size of the file in bytes
- **is_image**: Whether the file is an image
- **is_public**: Whether the file is publicly accessible
- **public_url**: URL to access the file if it's public
- **created_at**: When the file was created
- **updated_at**: When the file was last updated

Storage paths are generated using helper functions that follow this pattern:
- Application files: `app/{application_id}/[subpath]`
- Organization files: `org/{organization_id}/[subpath]`
- User files: `user/{user_id}/[subpath]`

Triggers are set up to:
1. Sync files from Supabase storage to the `files` table
2. Update file and image counts in the `application_stats` table
3. Track storage usage in the `application_stats` table

## Schema Gaps and Alignment Needs

1. **Missing Relationships**:
   - Flows need to be associated with applications
   - Credentials need to be associated with applications
   - Databases need to be associated with applications
   - Files/Images need to be associated with applications

2. **Missing Metrics**:
   - Credential count
   - Database count
   - Separate tracking for images vs files
   - Growth metrics
   - Revenue/cost metrics

3. **Triggers and Updates**:
   - Current trigger only updates organization count
   - Need triggers for user count, flow count, API calls, storage usage

## Proposed Schema Updates

1. **Add Foreign Keys**:
   - Add `application_id` to flows table
   - Add `application_id` to credentials table
   - Add `application_id` to any database-related tables
   - Add `application_id` to file/image storage tables

2. **Enhance application_stats Table**:
   - Add `credential_count` column
   - Add `database_count` column
   - Add `image_count` and `file_count` columns
   - Add `growth_percentage` column
   - Add `revenue_amount` column

3. **Create Additional Triggers**:
   - Trigger to update flow count when flows change
   - Trigger to update credential count when credentials change
   - Trigger to update database count when databases change
   - Trigger to update file/image counts when files/images change
   - Trigger to update storage usage when files/images change

## Implementation Plan

1. Create a new migration file that:
   - Adds the missing foreign key relationships
   - Enhances the application_stats table with additional columns
   - Creates the necessary triggers for automatic stat updates
   - Creates the default "Platform Sandbox" application

2. Update API endpoints to:
   - Return the complete application data including settings and stats
   - Accept and process the additional fields when creating/updating applications

3. Update the UI to:
   - Use the actual data from the database instead of mock data
   - Display all relevant metrics based on the schema

## Questions to Resolve

1. How should we calculate growth metrics? (e.g., daily, weekly, monthly comparison)
2. Should we track revenue/cost per application, and if so, how?
3. How do we handle migrations for existing data?
4. What permissions should different user roles have for viewing/managing applications? 


### Brian's additions

1. All chatflows (or agentflows) are associated with an application.  The default application is "Platform Sandbox", and is accessible to app platform owners/admins
2. We need a "folder" system within an application - this means that we, in supabase, are maintaining a table with "chatflow id", "application", and "path", where "path" would be the "path" for the folders, eg "/skills/email", which would b represented in the ui by nested folders of "skills"-> "email"


## Associated things to a application:
1. chatflows/agentflows
2. credentials
3. tools (shared availability, with a table maintained for which a given tool has an array of associated applications)
4. organizations
5. org-level users
6. billing plans
7. document stores
8. files and images (see our Supabase Storage implementation)
9. branding assets (logos, urls, etc.)
10. integrations (we still need to build this)
11. API Keys -these are leveraging the native api-key management in the platform.
12. SessionIds associated with the application, organization, and user

## Metrics tracking
Basic Metrics:
1. # of chatflows/agentflows
2. # of organizations
3. # of users
4. # of files
5. # of images
6. size of total files
7. size of total images
8. # of credentials

Advanced Metrics (tbd)
We have opentelemetry integrated into the plaform we can adapt this for additional metrics, like:
1. runs
2. actions
3. etc.


Access rules:
CRITICAL: Think of an application as a single SAAS offering.  Therefore the application "RemodlConstruct" (as an example) is different than the application "RemodlPharma".  Organizations should be able to be assigned to different versions of the sam application (e.g. we have RemodlConstruct Basic, RemodlConstruct Premium and RemodlConstruct Enterprise, we can assign or reassign any of those to a given org, but NOT to RemodlPharma)
1. Platform owners have access to everything across the platform AND can remove platform admins (or add them)
2. App owners/admins have access to whichever applications they've been granted access to
3. Organizations are associated with an application. We SHOULD be able to move them between applications (this can be figured out later if needed)
4. We can leverage the overrideConfig functionality (search for this implementation) to add an appId, orgId and userId to api calls to the /predictions endpoint. This shouldn't be breaking change if done properly.

FINAL THOUGHT: 
We should be able to implement this with minimal required chagnes to the core codebase, as everything should be able to be implemented on a layer above.

## Implementation Checklist

### Database Schema
- [x] Create organization_users table to link users to organizations
- [x] Update custom_access_token_hook to include organization_id in JWT claims
- [x] Create application_folders table with proper RLS policies
- [x] Add application_tools table to track which tools are available in which applications
- [x] Add application_billing_plans table to manage different pricing tiers
- [x] Add application_branding table for customization options
- [x] Add application_api_keys table for API access management
- [x] Create chat_sessions table linked to applications
- [x] Create flow_runs table to track execution metrics
- [x] Add triggers to update application_stats when related entities change

### API Implementation
- [x] Create API methods for application folders (get, create, update, delete)
- [x] Create API methods for application tools
- [x] Create API methods for application billing plans
- [x] Create API methods for application branding
- [x] Create API methods for application API keys
- [x] Create API methods for chat sessions
- [x] Create API methods for flow runs
- [x] Update existing API methods to include application context

### UI Implementation
- [ ] Create folder browser component for application content
- [ ] Implement application settings page
- [ ] Add application metrics dashboard
- [ ] Create application user management interface
- [ ] Implement application tool management
- [ ] Create application branding customization UI
- [ ] Implement API key management interface

### Security & Access Control
- [x] Implement RLS policies for application folders
- [ ] Implement RLS policies for all other application-related tables
- [ ] Create role-based access control for application management
- [ ] Add organization-level permissions

### Documentation
- [x] Document application schema and relationships
- [x] Document application folders implementation
- [ ] Document API endpoints for application management
- [ ] Create user guide for application features
- [ ] Document security model and access control

### Testing
- [ ] Create test suite for application folder operations
- [ ] Test application metrics tracking
- [ ] Validate security policies and access control
- [ ] Performance testing for large applications
- [ ] Test multi-organization scenarios
