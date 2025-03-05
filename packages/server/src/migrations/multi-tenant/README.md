# Multi-Tenant Architecture

This document outlines the implementation of multi-tenant features in the Flowise platform, which associates various resources with applications.

## Overview

The multi-tenant architecture allows:
- Isolating resources by application
- Controlling access based on user roles
- Tracking resource usage per application
- Enabling organization-level access to applications

## Multi-Level Access Model

Our implementation supports a multi-level access model:

1. **Platform Admins**: Have full access to all applications and resources across the platform
2. **App Admins/Members**: Can manage (create, update, delete) resources within their applications
3. **Organization Users**: Can use/run chatflows but cannot modify any resources. They only have read access to the resources needed to run the chatflows

This model ensures that:
- End users can use the chatflows without being able to modify the underlying configuration
- App admins can manage their applications without affecting other applications
- Platform admins have oversight and control over the entire platform

## Application Chatflows

The `application_chatflows` feature associates chatflows with specific applications.

### Database Schema

A table `application_chatflows` is created in Supabase with the following schema:
- `id`: UUID (Primary Key)
- `application_id`: UUID (Foreign Key to applications table)
- `chatflow_id`: UUID (Unique constraint)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### Triggers

A trigger function updates the `application_stats` table when chatflows are associated or disassociated with applications, keeping track of the number of chatflows per application.

### RLS Policies

Three RLS policies control access to chatflow-application mappings:
1. **Platform Admins**: Full access to all mappings
2. **App Admins**: Access limited to their applications
3. **Organization Users**: Read-only access to their organization's application chatflows

## Application Credentials

The `application_credentials` feature associates credentials with specific applications.

### Database Schema

A table `application_credentials` is created in Supabase with the following schema:
- `id`: UUID (Primary Key)
- `application_id`: UUID (Foreign Key to applications table)
- `credential_id`: UUID (Unique constraint)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### Triggers

A trigger function `update_application_stats_on_credential_change()` updates the `application_stats` table when credentials are associated or disassociated with applications, keeping track of the number of credentials per application.

### RLS Policies

Three RLS policies control access to credential-application mappings:
1. **Platform Admins**: Full access to all mappings
2. **App Admins**: Access limited to their applications
3. **Organization Users**: Read-only access to their organization's application credentials

### Service Implementation

A service `applicationcredentials` provides the following functions:
- `getApplicationIdForCredential`: Get the application ID for a credential
- `getCredentialIdsForApplication`: Get all credential IDs for an application
- `associateCredentialWithApplication`: Associate a credential with an application
- `removeCredentialAssociation`: Remove a credential's association with any application
- `getDefaultApplicationId`: Get the default application ID (Platform Sandbox)
- `isUserPlatformAdmin`: Check if a user is a platform admin

### Integration with Credentials Service

The credentials service is updated to integrate with the applicationcredentials service:
1. `createCredential`: Associates the new credential with an application
2. `updateCredential`: Updates the credential's application association
3. `deleteCredentials`: Removes the credential's application association
4. `getAllCredentials`: Filters credentials by application
5. `getCredentialById`: Includes the associated application ID in the response

## Application Tools

The `application_tools` feature associates tools with specific applications.

### Database Schema

A table `application_tools` is created in Supabase with the following schema:
- `id`: UUID (Primary Key)
- `application_id`: UUID (Foreign Key to applications table)
- `tool_id`: UUID (Unique constraint)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### Triggers

A trigger function `update_application_stats_on_tool_change()` updates the `application_stats` table when tools are associated or disassociated with applications, keeping track of the number of tools per application.

### RLS Policies

Three RLS policies control access to tool-application mappings:
1. **Platform Admins**: Full access to all mappings
2. **App Admins**: Access limited to their applications
3. **Organization Users**: Read-only access to their organization's application tools

### Service Implementation

A service `applicationtools` provides the following functions:
- `getApplicationIdForTool`: Get the application ID for a tool
- `getToolIdsForApplication`: Get all tool IDs for an application
- `associateToolWithApplication`: Associate a tool with an application
- `removeToolAssociation`: Remove a tool's association with any application
- `getDefaultApplicationId`: Get the default application ID (Platform Sandbox)
- `getUserApplications`: Get all applications for a user
- `isUserPlatformAdmin`: Check if a user is a platform admin

### Integration with Tools Service

The tools service is updated to use the `applicationtools` service through dynamic imports:
1. Filtering tools by application ID
2. Associating tools with applications when created
3. Removing tool associations when deleted
4. Checking if a tool belongs to an application when retrieving it

The UI components are updated to pass the application ID when interacting with tools, ensuring that users only see and modify tools they have access to.

## Next Steps

1. Update the UI to display and manage resource-application associations
2. Implement similar intercept services for other entities (databases, etc.)
3. Ensure that organization-level users have appropriate read-only access to all necessary resources 