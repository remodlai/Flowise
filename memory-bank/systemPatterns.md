# System Patterns

## Component Architecture

### Core Components

1. Remodl AI Platform Server (legacy name: Flowise Server)
   - Core platform functionality
   - Agent workflow processing
   - Database interactions
   - Located in: `/packages/server`
   - Note: Some legacy Flowise naming remains in package.json

2. Remodl Platform UI
   - Platform management interface
   - Admin functionality
   - Located in: `/packages/ui`
   - Direct gateway interaction

3. Remodl API Gateway
   - Central request handling
   - Authentication/Authorization
   - Located in: separate repository
   - Handles all platform and application routes

4. Remodl Auth Package
   - Authentication library
   - Located in: `/remodlai-auth`
   - Used by both platform and application UIs

### Frontend-Backend Interaction Pattern

1. Platform UI Pattern:
   - Direct interaction with platform through API Gateway
   - Full platform management capabilities
   - Platform-level access controls

2. Application UI Pattern:
   - Standalone frontends
   - Interaction through API Gateway
   - Required context:
     * application_id (path + header)
     * organization_id (path + header when needed)
     * User context (via JWT)

### Route Patterns

1. Platform Routes:
   - Strict RLS and API key controls
   - Highly limited access
   - Example: Telemetry collection
   - Not accessible via standard app/org credentials

2. Application Routes:
   - Context-based access
   - Examples:
     * Login: Requires application_id only
     * Org Management: Requires application_id + organization_id
   - Access controlled by JWT claims

### Request Handling Patterns

1. Client-Side Pattern (remodl-auth.ts):
   - `getAuthenticatedRoute` method handles:
     * Automatic header injection from JWT
     * Consistent auth header formatting
     * Simplified client-side implementation
   - Minimal client-side claim checking
   - Focus on request formation, not auth logic

2. Gateway-Side Pattern:
   - Gateway handles all auth/access decisions
   - Intercepts and validates:
     * Required path parameters
     * Required headers
     * JWT claims
   - Can derive missing context from JWT
   - Centralizes authorization logic
   - Reduces client-side complexity
   - Ensures consistent auth enforcement

### Auth Method Patterns

1. Local Auth Methods:
   - Simple JWT/Session handling
   - Basic claim checks
   - Examples:
     * getSession (whitelabeled client)
     * refreshSession (whitelabeled client)
     * signOut
     * isAuthenticated
     * isPlatformAdmin (simple claim check)
     * hasRole (simple claim check)

2. Gateway-Managed Auth Methods:
   - Complex permission logic
   - Resource-level access control
   - Examples:
     * hasPermission (granular control)
     * hasResourcePermission (RBAC implementation)
     * Permission escalation scenarios
   - Benefits:
     * Centralized permission logic
     * Dynamic updates without client changes
     * Support for complex RBAC scenarios
     * Granular control (folder/bucket/document level)

### Permission Patterns

1. Permission Granularity Pattern:
   - Resource-level permissions:
     * Bucket-level access
     * Folder-level access
     * Document-level access
   - Action-based permissions:
     * Read/Write/Delete
     * Comment/Edit
     * Admin actions
   - Context-aware permissions:
     * Organization context
     * Application context
     * User context

2. Permission Escalation Pattern:
   - Temporary elevation of permissions
   - Gateway-managed token refresh
   - Use cases:
     * Administrative actions
     * Billing changes
     * Security-sensitive operations

### Integration Patterns

1. Primary Integration Direction:
   - Internal → External systems
   - Outbound calls from platform
   - PKCE auth flow for authentication

2. External Integration Pattern:
   - Webhook-based approach (Future Development)
   - Event-driven architecture
   - External systems subscribe to events
   - Reduces direct integration complexity

## Legacy Considerations

1. Naming Convention:
   - Current branding: "Remodl AI Platform"
   - Legacy naming (to be avoided):
     * "Flowise" references
     * Legacy package names
   - Exception: Internal package.json references
   - All documentation uses Remodl AI branding

2. Code Migration:
   - Gradual transition from Flowise to Remodl naming
   - Priority on user-facing components
   - Internal references updated as touched 