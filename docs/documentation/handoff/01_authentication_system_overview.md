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

## Secrets Management

The platform has different approaches to secrets management between development and production:

1. **Development Environment**:
   - Secrets stored locally or in the database
   - API keys managed through local storage mechanisms

2. **Production Environment**:
   - AWS Secrets Manager for secure storage
   - Configured via environment variables:
     - `SECRETKEY_STORAGE_TYPE=aws`
     - `SECRETKEY_AWS_REGION`
     - `SECRETKEY_AWS_ACCESS_KEY`
     - `SECRETKEY_AWS_SECRET_KEY`

## Current Challenges

### Authentication System Disconnect

The primary issue is that there is no correlation between the legacy API keys and the new Supabase-based authentication system. This creates problems when:

1. API endpoints protected by Supabase authentication (`/api/v1/*`) are accessed using legacy API keys
2. The legacy API keys cannot be validated by the Supabase auth middleware
3. Requests fail with "Invalid authentication token" errors

### Environment-Specific Configurations

The different secrets management approaches between development and production add complexity:

1. Development uses local storage or database for API keys
2. Production uses AWS Secrets Manager
3. This requires careful environment-specific handling

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

### Configuration
- `packages/server/.env` - Environment variables
- `packages/server/.env.example` - Example environment configuration
- `packages/server/src/AppConfig.ts` - Application configuration

## Next Steps

The proposed solution is to create a bridge between the two authentication systems:

1. Implement a middleware that can:
   - Detect and validate legacy API keys
   - Generate temporary Supabase JWT tokens with appropriate permissions
   - Attach these tokens to requests for Supabase auth middleware

This approach would allow legacy API keys to continue working with the new Supabase-based auth system without requiring changes to existing clients. 