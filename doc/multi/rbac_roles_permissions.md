# Remodl AI RBAC Roles and Permissions

## Overview

This document defines the role-based access control (RBAC) structure for the Remodl AI platform. It outlines the hierarchical roles and their associated permissions within the platform → app → organization structure.

## Hierarchical Structure

The permissions follow our hierarchical model:
- Platform (top level)
- App (implementation within platform)
- Organization (tenant within app)

Permissions are inherited down the hierarchy, meaning a role at a higher level has all permissions of the corresponding roles at lower levels.

## Roles and Permissions

### Platform Level Roles

#### Platform Owner
The ultimate administrator with complete control over the entire platform.

**Permissions:**
- `platform.view` - View platform settings and metrics
- `platform.edit` - Modify platform settings
- `platform.manage_users` - Assign platform-level roles
- All permissions of Platform Admin

#### Platform Admin
High-level administrator with broad control over the platform.

**Permissions:**
- `platform.view` - View platform settings and metrics
- `platform.edit` - Modify platform settings
- `app.create` - Create new applications
- `app.view` - View all applications
- `app.edit` - Modify any application
- `app.delete` - Delete any application
- `org.view` - View all organizations across all apps
- `app.manage_users` - Manage users in any app
- `app.manage_integrations` - Manage integrations in any app
- `app.manage_workflows` - Manage workflows in any app
- `app.manage_credentials` - Manage credentials in any app
- `app.manage_document_stores` - Manage document stores in any app
- `app.manage_vector_stores` - Manage vector stores in any app
- `app.manage_images` - Manage images in any app
- `app.manage_files` - Manage files in any app
- All permissions of App Admin

### App Level Roles

#### App Owner
Owner of a specific application with full control over that application.

**Permissions:**
- `app.view` - View application details and metrics
- `app.edit` - Modify application settings
- `app.manage_users` - Assign app-level roles
- All permissions of App Admin

#### App Admin
Administrator for a specific application.

**Permissions:**
- `app.view` - View application details and metrics
- `app.edit` - Modify application settings
- `org.create` - Create new organizations within the app
- `org.view` - View all organizations within the app
- `org.edit` - Modify organizations within the app
- `org.delete` - Delete organizations within the app
- All permissions of Organization Admin

#### App Developer
Developer working on a specific application.

**Permissions:**
- `app.view` - View application details
- `chatflow.create` - Create new chatflows
- `chatflow.view` - View all chatflows in the app
- `chatflow.edit` - Edit any chatflow in the app
- `chatflow.delete` - Delete chatflows
- `credential.create` - Create new credentials
- `credential.view` - View all credentials in the app
- `credential.edit` - Edit any credential in the app
- `credential.delete` - Delete credentials
- `documentStore.create` - Create new document stores
- `documentStore.view` - View all document stores in the app
- `documentStore.edit` - Edit any document store in the app
- `documentStore.delete` - Delete document stores
- `vectorStore.create` - Create new vector stores
- `vectorStore.view` - View all vector stores in the app
- `vectorStore.edit` - Edit any vector store in the app
- `vectorStore.delete` - Delete vector stores
- `customTool.create` - Create new custom tools
- `customTool.view` - View all custom tools in the app
- `customTool.edit` - Edit any custom tool in the app
- `customTool.delete` - Delete custom tools

### Organization Level Roles

#### Organization Owner
Owner of a specific organization with full control over that organization.

**Permissions:**
- `org.view` - View organization details
- `org.edit` - Modify organization settings
- `org.manage_users` - Assign organization-level roles
- All permissions of Organization Admin

#### Organization Admin
Administrator for a specific organization within an application.

**Permissions:**
- `org.view` - View organization details
- `org.edit` - Modify organization settings
- `chatflow.create` - Create chatflows in the organization
- `chatflow.view` - View all chatflows in the organization
- `chatflow.edit` - Edit all chatflows in the organization
- `chatflow.delete` - Delete chatflows in the organization
- `user.invite` - Invite users to the organization
- `user.manage` - Manage user roles within the organization
- `billing.view` - View billing information
- `billing.edit` - Modify billing information
- `paymentMethod.create` - Create new payment methods
- `paymentMethod.view` - View payment methods
- `paymentMethod.edit` - Edit payment methods
- `paymentMethod.delete` - Delete payment methods
- `plan.view` - View plan information
- `plan.edit` - Modify plan information

#### Organization Member
Regular member of an organization.

**Permissions:**
- `org.view` - View organization details
- `chatflow.view` - View assigned chatflows
- `chatflow.edit` - Edit assigned chatflows (if given explicit access)
- `profile.view` - View profile information
- `profile.edit` - Edit profile information
- `file.view` - View files
- `file.edit` - Edit files
- `file.delete` - Delete files
- `file.upload` - Upload files
- `file.download` - Download files
- `file.share` - Share files
- `file.preview` - Preview files
- `file.search` - Search files
- `file.tag` - Tag files
- `file.comment` - Comment on files

## Resource-Specific Permissions

### Chatflow Permissions
- `chatflow.create` - Create new chatflows
- `chatflow.view` - View chatflows
- `chatflow.edit` - Edit chatflows
- `chatflow.delete` - Delete chatflows
- `chatflow.deploy` - Deploy chatflows
- `chatflow.run` - Run/execute chatflows
- `chatflow.clone` - Clone chatflows
- `chatflow.list` - List chatflows
- `chatflow.search` - Search chatflows
- `chatflow.export` - Export chatflows
- `chatflow.import` - Import chatflows
- `chatflow.enable` - Enable chatflows
- `chatflow.disable` - Disable chatflows

### Document Permissions
- `document.create` - Create documents/knowledge base entries
- `document.view` - View documents
- `document.edit` - Edit documents
- `document.delete` - Delete documents

### Analytics Permissions
- `analytics.view` - View analytics data
- `analytics.export` - Export analytics data

### Integration Permissions
- `integration.create` - Create new integrations
- `integration.view` - View integrations
- `integration.edit` - Modify integrations
- `integration.delete` - Delete integrations
- `integration.list` - List integrations
- `integration.search` - Search integrations

### Workflow Permissions
- `workflow.create` - Create new workflows
- `workflow.view` - View workflows
- `workflow.edit` - Edit workflows
- `workflow.delete` - Delete workflows
- `workflow.list` - List workflows
- `workflow.search` - Search workflows

### Credential Permissions
- `credential.create` - Create credentials for services
- `credential.view` - View credentials (limited info)
- `credential.edit` - Edit credentials
- `credential.delete` - Delete credentials
- `credential.list` - List credentials
- `credential.search` - Search credentials
- `credential.test` - Test credentials
- `credential.refresh` - Refresh credentials
- `credential.delete` - Delete credentials
- `credential.assign` - Assign credentials to app or organization
- `credential.unassign` - Unassign credentials from app or organization

### User Permissions
- `user.invite` - Invite users to the organization
- `user.manage` - Manage user roles within the organization
- `user.view` - View user profiles
- `user.edit` - Edit user profiles
- `user.delete` - Delete user profiles
- `user.list` - List users
- `user.search` - Search users
- `user.resetPassword` - Reset user passwords
- `user.changePassword` - Change user passwords
- `user.changeEmail` - Change user emails
- `user.changeRole` - Change user roles
- `user.changeStatus` - Change user statuses

### DocumentStore Permissions
- `documentStore.create` - Create new document stores
- `documentStore.view` - View document stores
- `documentStore.edit` - Edit document stores
- `documentStore.delete` - Delete document stores
- `documentStore.list` - List document stores
- `documentStore.search` - Search document stores
- `documentLoader.list` - List document loaders
- `documentLoader.search` - Search document loaders

### VectorStore Permissions
- `vectorStore.create` - Create new vector stores
- `vectorStore.view` - View vector stores
- `vectorStore.edit` - Edit vector stores
- `vectorStore.delete` - Delete vector stores
- `vectorStore.list` - List vector stores
- `vectorStore.search` - Search vector stores

### Images Permissions
- `image.upload` - Upload images
- `image.view` - View images
- `image.delete` - Delete images
- `image.list` - List images
- `image.search` - Search images
- `image.tag` - Tag images
- `image.comment` - Comment on images

### File Permissions
- `file.upload` - Upload files
- `file.view` - View files
- `file.delete` - Delete files
- `file.list` - List files
- `file.search` - Search files
- `file.tag` - Tag files
- `file.comment` - Comment on files

## Implementation Notes

These roles and permissions will be implemented in Supabase using:
1. Custom types for roles and permissions
2. Role-permission mapping tables
3. User-role assignment tables with context (platform, app, or org level)
4. Custom JWT claims for efficient permission checking
5. Row Level Security (RLS) policies based on these permissions

## SQL Implementation

```sql
-- Create custom types
CREATE TYPE public.app_role AS ENUM (
  'platform_owner', 'platform_admin',
  'app_owner', 'app_admin', 'app_developer',
  'org_owner', 'org_admin', 'org_member'
);

CREATE TYPE public.app_permission AS ENUM (
  -- Platform permissions
  'platform.view', 'platform.edit', 'platform.manage_users',
  
  -- App permissions
  'app.create', 'app.view', 'app.edit', 'app.delete', 'app.manage_users',
  
  -- Organization permissions
  'org.create', 'org.view', 'org.edit', 'org.delete', 'org.manage_users',
  
  -- Resource permissions
  'chatflow.create', 'chatflow.view', 'chatflow.edit', 'chatflow.delete', 'chatflow.deploy', 'chatflow.run',
  'document.create', 'document.view', 'document.edit', 'document.delete',
  'analytics.view', 'analytics.export',
  'integration.create', 'integration.view', 'integration.edit', 'integration.delete',
  'credential.create', 'credential.view', 'credential.edit', 'credential.delete',
  'user.invite', 'user.manage'
);
``` 