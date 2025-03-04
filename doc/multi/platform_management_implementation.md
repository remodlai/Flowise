# Platform Management Implementation

## Overview

The Platform Management feature allows platform administrators to control which nodes and tools are available to users when building chatflows. This document outlines the implementation details of this feature.

## Database Structure

### Tables

1. **platform_enabled_nodes**
   - Tracks which nodes are enabled at the platform level
   - Schema:
     ```sql
     CREATE TABLE IF NOT EXISTS public.platform_enabled_nodes (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       node_type TEXT NOT NULL UNIQUE,
       enabled BOOLEAN DEFAULT true,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```

2. **platform_enabled_tools**
   - Tracks which tools are enabled at the platform level
   - Schema:
     ```sql
     CREATE TABLE IF NOT EXISTS public.platform_enabled_tools (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       tool_type TEXT NOT NULL UNIQUE,
       enabled BOOLEAN DEFAULT true,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```

### SQL Functions

1. **get_enabled_nodes**
   - Returns all enabled nodes
   - Used by the frontend to filter available nodes

2. **get_enabled_tools**
   - Returns all enabled tools
   - Used by the frontend to filter available tools

3. **toggle_node_enabled**
   - Toggles the enabled status of a node
   - Requires platform.admin permission

4. **toggle_tool_enabled**
   - Toggles the enabled status of a tool
   - Requires platform.admin permission

5. **get_user_permissions**
   - Returns all permissions for the current user
   - Used by the authorization middleware

## Backend Implementation

### Controllers

1. **PlatformController**
   - `getNodesWithEnabledStatus`: Gets all nodes with their enabled status
   - `toggleNodeEnabled`: Toggles the enabled status of a node
   - `getToolsWithEnabledStatus`: Gets all tools with their enabled status
   - `toggleToolEnabled`: Toggles the enabled status of a tool

### Middleware

1. **authorizationMiddleware**
   - `checkAuthorization`: Checks if the user has the required permissions
   - Used to protect platform management routes

### Routes

1. **platform.ts**
   - `/platform/nodes`: Get all nodes with their enabled status
   - `/platform/nodes/toggle`: Toggle node enabled status
   - `/platform/tools`: Get all tools with their enabled status
   - `/platform/tools/toggle`: Toggle tool enabled status

## Frontend Implementation

### API Client

1. **platform.js**
   - `getNodesWithEnabledStatus`: Gets all nodes with their enabled status
   - `toggleNodeEnabled`: Toggles the enabled status of a node
   - `getToolsWithEnabledStatus`: Gets all tools with their enabled status
   - `toggleToolEnabled`: Toggles the enabled status of a tool

### Components

1. **NodeToggleCard**
   - Displays a node with its enabled status
   - Allows toggling the enabled status

2. **ToolToggleCard**
   - Displays a tool with its enabled status
   - Allows toggling the enabled status

3. **CategoryFilter**
   - Allows filtering nodes/tools by category

### Views

1. **PlatformNodesView**
   - Displays all nodes with their enabled status
   - Allows toggling the enabled status of nodes

2. **PlatformToolsView**
   - Displays all tools with their enabled status
   - Allows toggling the enabled status of tools

## Integration with Chatflow Builder

When building a chatflow, the frontend checks if a node/tool is enabled before displaying it. This is done by:

1. Fetching all available nodes/tools
2. Fetching the enabled status of each node/tool
3. Filtering out disabled nodes/tools
4. Displaying only enabled nodes/tools in the chatflow builder

## Security

Access to platform management features is restricted to users with the `platform.admin` permission. This is enforced through:

1. Row Level Security (RLS) policies on the database tables
2. Authorization middleware on the backend routes
3. UI visibility controls on the frontend

## Future Improvements

1. Add bulk enable/disable functionality
2. Add search functionality for nodes/tools
3. Add usage statistics for nodes/tools
4. Add ability to set default configurations for nodes/tools 