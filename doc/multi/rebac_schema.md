# ReBac Authorization Schema Documentation

## Overview

This document describes the Relationship-Based Access Control (ReBac) schema implemented for the Flowise platform. The schema enables fine-grained access control across a hierarchical multi-tenant architecture, with special attention to credential management and resource sharing.

## Core Hierarchical Structure

The authorization schema follows a hierarchical structure:

```
Platform → App → Organization → Project → Workspace
             ↓
Organization → Conversation → Session
```

This structure supports:
- Multi-product strategy (different apps on the same platform)
- Clean multi-tenancy (organizational isolation)
- Proper permission inheritance down the hierarchy

## Entity Types and Relationships

### 1. Platform Level

The top level of the hierarchy, representing the core Flowise platform.

```typescript
type platform
    relation platform_owner: user
    relation platform_admin: user | platform_owner
    
    permission manage_apps: platform_owner | platform_admin
    permission view_all: platform_owner | platform_admin
```

- **Platform Owner**: The creator/owner of the platform
- **Platform Admin**: Administrators with broad platform-level permissions

### 2. App Level

Represents specific product offerings built on the platform (e.g., FlowiseConstruct, FlowisePharma).

```typescript
type app
    relation parent: platform
    relation app_owner: user | parent.platform_owner
    relation app_admin: user | app_owner | parent.platform_admin
    
    permission manage_orgs: app_owner | app_admin | parent.manage_apps
    permission view_all: app_owner | app_admin | parent.view_all
    permission create_org: app_owner | app_admin | parent.manage_apps
```

- **App Owner**: Owners of specific apps (typically internal team members)
- **App Admin**: Administrators for specific apps

### 3. Organization Level

Represents customer organizations using specific apps.

```typescript
type organization
    relation parent: app
    relation org_owner: user | group#member| group#super_admin
    relation org_admin: user | group#super_admin | org_owner
    relation finance: user | group#super_admin | org_owner
    relation member: user | group#member
    
    permission can_create: org_owner | org_admin | parent.app_owner | parent.app_admin | parent.create_org
    permission can_edit: org_owner | org_admin | parent.app_owner | parent.app_admin
    permission can_delete: org_owner | org_admin | parent.app_owner | parent.app_admin
    permission can_view: org_owner | org_admin | finance | member | parent.app_owner | parent.app_admin | parent.view_all
```

- **Org Owner**: Customer organization owners
- **Org Admin**: Customer organization administrators
- **Finance**: Users with financial access
- **Member**: Regular members of the organization

### 4. Project and Workspace Levels

Projects and workspaces provide organizational structure within an organization.

```typescript
type project
    relation parent: organization
    relation project_owner: user | parent.org_owner | parent.org_admin
    relation admin: user | project_owner
    relation member: user | admin | parent.member | group#member
    
    permission can_create: project_owner | admin | parent.org_owner | parent.org_admin
    permission can_edit: project_owner | admin | parent.org_owner | parent.org_admin
    permission can_delete: project_owner | parent.org_owner | parent.org_admin
    permission can_view: project_owner | admin | member | parent.org_owner | parent.org_admin | parent.finance | parent.can_view

type workspace
    relation parent: project
    relation workspace_owner: user | parent.project_owner | parent.admin
    relation editor: user | workspace_owner
    relation viewer: user | editor | parent.member
    
    permission can_create: workspace_owner | editor | parent.can_create
    permission can_edit: workspace_owner | editor | parent.can_edit
    permission can_delete: workspace_owner | parent.project_owner | parent.admin | parent.can_delete
    permission can_view: workspace_owner | editor | viewer | parent.can_view
```

### 5. Conversation and Session Levels

Conversations and sessions represent user interactions within the platform.

```typescript
type conversation
    relation parent: organization | workspace
    relation conversation_owner: user
    relation participant: user | parent.member
    
    permission can_view: conversation_owner | participant | parent.org_owner | parent.org_admin | parent.workspace_owner
    permission can_edit: conversation_owner | parent.org_owner | parent.org_admin
    permission can_delete: conversation_owner | parent.org_owner | parent.org_admin

type session
    relation parent: conversation
    relation session_owner: user
    
    permission can_view: session_owner | parent.participant | parent.conversation_owner
    permission can_edit: session_owner | parent.conversation_owner
    permission can_delete: session_owner | parent.conversation_owner
```

## Credential Management

Special attention has been given to credential management as it represents access to external systems and services.

```typescript
type credential
    relation parent: organization | app | platform
    relation credential_owner: user | parent.org_owner | parent.app_owner | parent.platform_owner
    relation credential_admin: user | credential_owner
    relation credential_user: user | credential_admin | parent.org_admin | parent.app_admin | parent.platform_admin
    relation shared_with_user: user
    relation shared_with_workspace: workspace
    relation shared_with_project: project
    relation shared_with_organization: organization
    
    permission can_create: parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin
    permission can_view: credential_owner | credential_admin | shared_with_user | shared_with_workspace.editor | shared_with_workspace.viewer | shared_with_project.admin | shared_with_project.member | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_organization.member | parent.org_owner | parent.app_owner | parent.platform_owner
    permission can_edit: credential_owner | credential_admin | parent.org_owner | parent.app_owner | parent.platform_owner
    permission can_delete: credential_owner | parent.org_owner | parent.app_owner | parent.platform_owner
    permission can_use: credential_user | credential_owner | credential_admin | shared_with_user | shared_with_workspace.editor | shared_with_workspace.viewer | shared_with_project.admin | shared_with_project.member | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_organization.member | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin
    permission can_share: credential_owner | parent.org_owner | parent.app_owner | parent.platform_owner | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_project.project_owner | shared_with_workspace.workspace_owner
```

### Credential Management Features

1. **Hierarchical Management**
   - Platform-level credentials can be managed by platform owners/admins
   - App-level credentials can be managed by app owners/admins
   - Organization-level credentials can be managed by org owners/admins

2. **Usage vs. Management Separation**
   - `credential_admin`: Users who can administer credentials
   - `credential_user`: Users who can use the credential but can't modify it
   - `can_use` permission: Who can utilize credentials to access external services
   - `can_edit` permission: Who can modify credential configuration

3. **Credential Sharing**
   - Credentials can be shared at multiple levels:
     - With specific users (`shared_with_user`)
     - With workspaces (`shared_with_workspace`)
     - With projects (`shared_with_project`)
     - With organizations (`shared_with_organization`)
   - Only certain roles can re-share credentials (`can_share` permission)
   - Members of shared entities can use but not modify credentials

4. **Permission Inheritance**
   - Permissions appropriately flow down from parent entities
   - Platform-level administrators can manage all credentials
   - App-level administrators can manage credentials for their app and its organizations
   - Organization-level administrators can manage their organization's credentials

## File Asset Management

File assets are managed with similar hierarchical controls:

```typescript
type file_asset
    relation parent: organization | conversation | session
    relation file_owner: user
    relation uploader: user | file_owner
    relation editor: user | file_owner | uploader | parent.org_owner | parent.conversation_owner | parent.session_owner
    relation viewer: user | editor | parent.participant | parent.member | parent.viewer
    
    permission can_view: file_owner | uploader | viewer | parent.can_view
    permission can_edit: file_owner | editor | parent.org_owner | parent.org_admin
    permission can_delete: file_owner | parent.org_owner | parent.org_admin
```

## Storage Management

Storage locations have dedicated permissions:

```typescript
type storage_location
    relation parent: app | organization
    relation storage_owner: user | parent.app_owner | parent.org_owner
    relation manager: user | storage_owner
    
    permission can_manage: storage_owner | manager | parent.app_owner | parent.org_owner
    permission can_view: storage_owner | manager | parent.app_admin | parent.org_admin | parent.app_owner | parent.org_owner
```

## Implementation Notes

This schema should be used with Descope's ReBac implementation for authentication and authorization. Key endpoints to modify:

1. `packages/server/src/utils/storageUtils.ts`
2. `packages/server/src/utils/multiModalUtils.ts`
3. `packages/server/src/utils/buildAgentGraph.ts`
4. `packages/server/src/utils/authUtils.ts`
5. `packages/server/src/utils/authZ.ts`

Storage paths should follow the hierarchical structure:
```
{appId}/{orgId}/conversations/{conversationId}/users/{userId}/sessions/{sessionId}/{fileName}
```

## Benefits

1. **Comprehensive Access Control**: Fine-grained permissions at each level
2. **Multi-tenancy**: Clean isolation between organizations
3. **Hierarchical Inheritance**: Permissions flow naturally through the structure
4. **Flexible Sharing**: Resources can be shared across the hierarchy with controlled access levels
5. **Scalable Architecture**: Supports multiple products on the same platform core 