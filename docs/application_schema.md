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
- **resource_limits**: JSON object containing limits for:
  - **api_calls**: Daily and monthly API call limits
  - **storage**: Maximum storage in GB
  - **users**: Maximum user count
- **features**: JSON object containing feature flags:
  - **file_uploads**: Whether file uploads are enabled
  - **custom_domains**: Whether custom domains are enabled
  - **sso**: Whether SSO is enabled
  - **api_access**: Whether API access is enabled
  - **advanced_analytics**: Whether advanced analytics are enabled
- **enabled_models**: Array of enabled AI models

### Application Stats (application_stats table)
- **organization_count**: Number of organizations in the application
- **user_count**: Number of users across all organizations
- **flow_count**: Number of flows in the application
- **api_calls_count**: Number of API calls made
- **storage_used_bytes**: Total storage used in bytes
- **last_updated**: When the stats were last updated

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
- **Application** → **Files/Images**: One-to-many (relationship needs to be established)

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
