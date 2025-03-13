# Authentication and Authorization

This section contains documentation about the authentication and authorization system used in the platform.

## Overview

The platform uses Supabase Auth for authentication and a custom role-based access control (RBAC) system for authorization. The authentication system is integrated with the platform's multi-tenant architecture, allowing for organization-specific and application-specific permissions.

## Topics

- [Enhanced User Metadata](./enhanced_user_metadata.md) - Information about the enhanced user metadata system, including service users and additional context
- [Custom Access Token Hook](./custom_access_token_hook.md) - Details about the custom access token hook used to add claims to JWT tokens
- [Role-Based Access Control](./rbac.md) - Information about the role-based access control system
- [Service Users](./service_users.md) - Details about service users and how they are used in the platform
- [Implementation Plan](./implementation_plan.md) - Current status and next steps for the authentication system

## Implementation Status

The enhanced user metadata system has been successfully implemented and deployed. The custom access token hook now adds the following metadata to JWT claims:

- User first name and last name
- User status (active, pending, suspended)
- Service user flag
- Application context (ID, name)
- Organization context (ID, name)
- Creator information (ID, first name, last name)

These claims can now be used for authorization decisions and UI customization.

## Authentication Flow

1. Users sign up or log in through Supabase Auth
2. Upon successful authentication, a JWT token is generated with custom claims
3. The JWT token is used for subsequent API requests
4. The platform verifies the JWT token and uses the claims for authorization decisions

## Key Components

- **Supabase Auth**: Handles user registration, login, and token management
- **Custom Access Token Hook**: Adds custom claims to JWT tokens
- **RBAC System**: Defines roles and permissions for users
- **Authorization Middleware**: Verifies JWT tokens and enforces access control

## Integration Points

- **Frontend**: Uses Supabase Auth client for authentication
- **Backend**: Uses Supabase Auth server-side for token verification
- **Database**: Uses row-level security (RLS) policies for data access control 