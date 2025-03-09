# Authentication System Overview

## Current Architecture

The Remodl AI platform (built on top of Flowise) currently has two separate authentication systems that operate independently:

1. **Legacy API Key System**
   - Used by the original Flowise platform
   - API keys stored in either JSON files or a database table (`apikey`)
   - Configured via `APIKEY_STORAGE_TYPE` environment variable ('json' or 'db')
   - Used for authenticating API requests to chatflows and other core functionality

2. **Supabase-based Multi-tenant Auth System**
   - New authentication system using Supabase Auth
   - JWT-based authentication with custom claims
   - Supports role-based access control (RBAC)
   - Used for the admin layer and multi-tenant features

## Key Components

### Legacy API Key System

- **Storage**: API keys can be stored in either:
  - JSON file (default): Managed through `packages/server/src/utils/apiKey.ts`
  - Database: Stored in the `apikey` table defined in `packages/server/src/database/entities/ApiKey.ts`

- **Validation**: API keys are validated through:
  - `validateAPIKey` function in `packages/server/src/utils/validateKey.ts`
  - `verifyApiKey` service in `packages/server/src/services/apikey/index.ts`

- **Routes**: API key routes defined in:
  - `packages/server/src/routes/apikey/index.ts` (CRUD operations)
  - `packages/server/src/routes/verify/index.ts` (verification)

### Supabase Auth System

- **Configuration**: Supabase client initialized in `packages/server/src/utils/supabase.ts`
- **Authentication Middleware**: `authenticateUser` in `packages/server/src/utils/supabaseAuth.ts`
- **JWT Claims**: Custom claims added via the `custom_access_token_hook` function
- **Routes**: Auth routes defined in:
  - `packages/server/src/routes/auth/login.ts`
  - `packages/server/src/routes/auth/callback.ts`
  - `packages/server/src/routes/auth/users.ts`

### JWT Structure and Custom Claims

Our JWT tokens include the following custom claims:

- `userId`: Direct copy of the user's UUID from the `sub` claim for easier access
- `organizationId`: The user's primary organization ID
- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of objects with role, resource_type, and resource_id
- `first_name`, `last_name`, `organization_name`: User profile information
- `profile_role`: The user's role from their profile

These claims are added by the `custom_access_token_hook` function in Supabase, which:
1. Extracts user information from the `user_profiles` table
2. Determines if the user is a platform admin
3. Retrieves the user's primary organization ID
4. Gets the user's roles with resource context
5. Adds all this information to the JWT claims

For more details on the JWT structure and implementation, see [JWT Claims Update](./jwt_claims_update.md).

## Secrets Management

The platform has migrated all secrets to Supabase from legacy systems. This includes:

1. **API Keys**: Stored in Supabase database tables
2. **Credentials**: Stored in Supabase database tables
3. **User Authentication**: Handled by Supabase Auth

All references to AWS Secrets Manager in the codebase are outdated and should be ignored.

## Current Challenges

### Authentication System Disconnect

The primary issue is that there is no correlation between the legacy API keys and the new Supabase-based authentication system. This creates problems when:

1. API endpoints protected by Supabase authentication (`/api/v1/*`) are accessed using legacy API keys
2. The legacy API keys cannot be validated by the Supabase auth middleware
3. Requests fail with "Invalid authentication token" errors

### API Key Bridge Solution

To address this disconnect, we've implemented an API Key Bridge solution that:
1. Validates legacy API keys
2. Maps them to Supabase users
3. Generates temporary JWT tokens for authenticated API requests

For more details on this solution, see [API Key Bridge Solution](./02_api_key_bridge_solution.md).

## Related Files

### Legacy API Key System
- `packages/server/src/utils/apiKey.ts` - Core API key management functions
- `packages/server/src/utils/validateKey.ts` - API key validation logic
- `packages/server/src/services/apikey/index.ts` - API key service layer
- `packages/server/src/controllers/apikey/index.ts` - API key controllers
- `packages/server/src/routes/apikey/index.ts` - API key routes
- `packages/server/src/database/entities/ApiKey.ts` - API key entity definition

### Supabase Auth System
- `packages/server/src/utils/supabase.ts` - Supabase client initialization
- `packages/server/src/utils/supabaseAuth.ts` - Authentication middleware
- `packages/server/src/routes/auth/login.ts` - Login route
- `packages/server/src/routes/auth/users.ts` - User management routes
- `packages/server/src/routes/api.ts` - API routes with auth middleware

### JWT Custom Claims
- `packages/server/src/migrations/multi-tenant/custom_access_hooks/working_hook_valid/working_auth_token_hook_valid.sql` - Current working custom access token hook
- `packages/server/src/migrations/multi-tenant/custom_access_hooks/custom_access_hooks_changelog.md` - Changelog for custom access hooks

### Configuration
- `packages/server/.env` - Environment variables
- `packages/server/.env.example` - Example environment configuration
- `packages/server/src/AppConfig.ts` - Application configuration

