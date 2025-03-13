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

5. [AWS Secrets Migration](05_aws_secrets_migration/README.md)
   - Migration plan for moving from local secrets to AWS Secrets Manager
   - Implementation details and code examples
   - Testing and rollback strategies

6. [Application Context Filtering](06_application_context_filtering.md)
   - Implementation of application-specific resource filtering
   - How credentials, API keys, and other resources are scoped to applications
   - User experience and troubleshooting

7. [File Storage Integration](07_file_storage/README.md)
   - Comprehensive plan for integrating Supabase Storage
   - Migration from base64 encoding to proper file storage
   - API endpoints and UI components for file management
   - Detailed implementation guides:
     - [Core Storage Infrastructure](07_file_storage/01_core_storage_infrastructure.md)
     - [API Endpoints](07_file_storage/02_api_endpoints.md)
     - [Flowise Compatibility](07_file_storage/03_flowise_compatibility.md)
     - [File Chooser Component](07_file_storage/04_file_chooser_component.md)

8. [Application Routes and Controller](application_routes.md)
   - API endpoints for managing applications
   - Controller methods for application operations
   - Application logo upload functionality
   - Permission model for application management

9. [User Routes and Controller](user_routes.md)
   - Context-based user management (global, organization, application)
   - Service user implementation and management
   - Organization member and admin role management
   - Permission model for user operations
   - Code examples for common user management tasks

## Current Challenges

The platform is currently facing several challenges:

1. **Authentication System Disconnect**: The legacy API key system and the new Supabase-based authentication system operate independently with no correlation between them.

2. **Environment-Specific Configurations**: Different environments (dev, prod) use different secret storage mechanisms, adding complexity to the codebase.

3. **Permission Granularity**: Some operations require more fine-grained permissions than currently implemented.

4. **File Storage Inconsistency**: Mixed usage of base64 encoding, legacy storage, and Supabase Storage leading to truncation issues and inconsistent user experience.

## Active Development

The team is actively working on:

1. **API Key Bridge**: Implementing a solution to bridge legacy API keys with the Supabase authentication system.

2. **Enhanced RLS Policies**: Refining Row-Level Security policies to provide more granular access control.

3. **Unified Secret Management**: Standardizing secret management across environments.

4. **Application Context Filtering**: Ensuring resources are properly scoped to their respective applications.

5. **Supabase Storage Integration**: Implementing a comprehensive file storage solution using Supabase Storage.

6. **Application Management**: Enhancing application management capabilities, including logo upload functionality.

7. **Context-Based User Management**: Implementing a comprehensive user management system with context-based access control (global, organization, application) and service user support.

## Getting Started

If you're new to the project, we recommend:

1. Read the [Authentication System Overview](01_authentication_system_overview.md) to understand the current architecture.

2. Review the [Multi-tenant Architecture](03_multi_tenant_architecture.md) to understand how the platform supports multiple applications and organizations.

3. Explore the [API Key Bridge Solution](02_api_key_bridge_solution.md) to understand the proposed solution for the authentication system disconnect.

4. Check the [Secrets Management](04_secrets_management.md) document to understand how secrets are managed in different environments.

5. Review the [Application Context Filtering](06_application_context_filtering.md) to understand how resources are scoped to applications.

6. Explore the [File Storage Integration](07_file_storage/README.md) to understand the comprehensive plan for file storage.

7. Review the [Application Routes and Controller](application_routes.md) to understand how applications are managed in the platform.

8. Review the [User Routes and Controller](user_routes.md) to understand how user management is handled in the platform.

## Key Files

- `packages/server/src/utils/supabaseAuth.ts`: Supabase authentication middleware
- `packages/server/src/utils/apiKey.ts`: Legacy API key management
- `packages/server/src/utils/validateKey.ts`: API key validation
- `packages/server/src/services/apikey/index.ts`: API key service layer
- `packages/server/src/routes/api.ts`: API routes with authentication middleware
- `packages/server/src/migrations/multi-tenant/`: SQL migrations for the multi-tenant architecture
- `packages/server/src/utils/supabaseStorage.ts`: Supabase Storage utilities
- `packages/server/src/utils/multiModalUtils.ts`: Multi-modal message handling
- `packages/server/src/utils/setupSupabaseStorage.ts`: Storage initialization
- `packages/server/src/controllers/ApplicationController.ts`: Application management controller
- `packages/server/src/controllers/UserController.ts`: User management controller
- `packages/server/src/controllers/OrganizationController.ts`: Organization management controller

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