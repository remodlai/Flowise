# Remodl AI Platform Handoff Documentation

## Overview

This documentation provides a comprehensive overview of the Remodl AI platform's current state, architecture, challenges, and proposed solutions. It is intended to help new team members understand the system and continue development.

## Contents

1. [Authentication System Overview](01_authentication_system_overview.md)
   - Current architecture with legacy API keys and Supabase auth
   - Key components of both authentication systems
   - Current challenges and related files

2. [API Key Bridge Solution](02_api_key_bridge_solution.md)
   - Detailed proposal for bridging legacy API keys with Supabase auth
   - Implementation details with code examples
   - Security considerations and testing approach

3. [Multi-tenant Architecture](03_multi_tenant_architecture.md)
   - Overview of the multi-tenant architecture using Supabase
   - Data model and authentication flow
   - Row-Level Security (RLS) policies and helper functions

4. [Secrets Management](04_secrets_management.md)
   - Different approaches to secrets management in development vs. production
   - Implementation details for AWS Secrets Manager integration
   - Challenges and recommendations

## Current Challenges

The platform is currently facing several challenges:

1. **Authentication System Disconnect**: The legacy API key system and the new Supabase-based authentication system operate independently with no correlation between them.

2. **Environment-Specific Configurations**: Different environments (dev, prod) use different secret storage mechanisms, adding complexity to the codebase.

3. **Permission Granularity**: Some operations require more fine-grained permissions than currently implemented.

## Active Development

The team is actively working on:

1. **API Key Bridge**: Implementing a solution to bridge legacy API keys with the Supabase authentication system.

2. **Enhanced RLS Policies**: Refining Row-Level Security policies to provide more granular access control.

3. **Unified Secret Management**: Standardizing secret management across environments.

## Getting Started

If you're new to the project, we recommend:

1. Read the [Authentication System Overview](01_authentication_system_overview.md) to understand the current architecture.

2. Review the [Multi-tenant Architecture](03_multi_tenant_architecture.md) to understand how the platform supports multiple applications and organizations.

3. Explore the [API Key Bridge Solution](02_api_key_bridge_solution.md) to understand the proposed solution for the authentication system disconnect.

4. Check the [Secrets Management](04_secrets_management.md) document to understand how secrets are managed in different environments.

## Key Files

- `packages/server/src/utils/supabaseAuth.ts`: Supabase authentication middleware
- `packages/server/src/utils/apiKey.ts`: Legacy API key management
- `packages/server/src/utils/validateKey.ts`: API key validation
- `packages/server/src/services/apikey/index.ts`: API key service layer
- `packages/server/src/routes/api.ts`: API routes with authentication middleware
- `packages/server/src/migrations/multi-tenant/`: SQL migrations for the multi-tenant architecture

## Environment Setup

The platform requires several environment variables to be set:

```
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# API Key Configuration
APIKEY_STORAGE_TYPE=json  # or 'db'
APIKEY_PATH=/your_api_key_path/.flowise

# Secret Key Configuration
SECRETKEY_STORAGE_TYPE=local  # or 'aws'
SECRETKEY_PATH=/your_secret_key_path/.flowise
# For AWS Secrets Manager
SECRETKEY_AWS_REGION=us-west-2
SECRETKEY_AWS_ACCESS_KEY=your-access-key
SECRETKEY_AWS_SECRET_KEY=your-secret-key
```

See `.env.example` for a complete list of environment variables. 