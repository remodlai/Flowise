## Custom Access Token Hook Changelog

### v1 - Initial Implementation
- Added user profile metadata to JWT claims
- Added RBAC roles to JWT claims
- Added basic admin detection

### v2 - Improved Role Handling
- Enhanced role retrieval
- Improved admin detection
- Added better error handling

### v3 - User Metadata Updates
- Added functionality to update user metadata
- Added permissions to JWT claims
- Added error and success logging

### v4 - Enhanced Metadata Updates
- Removed debugging log statements
- Added more robust handling of metadata updates
- Ensured compatibility with fixed RLS policies to avoid circular dependencies

### v4.1 - Backward Compatibility Fix
- Added compatibility with code that references the old `user_roles` table
- Created a view and triggers to map between the new `user_custom_roles`/`custom_roles` tables and the expected `user_roles` structure
- This ensures existing code continues to work while the application is updated to use the new schema

### v5 - Enhanced Superadmin Detection
- Enhanced superadmin detection to ensure platform admins are properly identified
- Added explicit check for 'superadmin' role in user metadata
- Improved handling of base_role assignment for superadmins
- Ensured superadmins are always marked as platform_admin in user_role
- Added direct update to auth.users table to ensure UI reflects correct role
- Fixed issue where superadmins might not have access to global context

### v6 - Comprehensive JWT Claims
- Combined functionality of v5 and v1_platform_admin_jwt_claim
- Added platform_admin claim to JWT for RLS policies
- Ensured all necessary claims are included in a single hook
- Fixed issue with platform admins not seeing all applications

### v7 - Simplified Auth Hook
- Simplified the hook implementation to focus on core functionality
- Added more robust error handling with specific EXCEPTION blocks
- Added test_claim to verify hook is working

### v8 - Resource-Based Access Control
- Added resource_type and resource_id columns to user_custom_roles table
- Updated unique constraint to include resource fields
- Enhanced JWT claims to include resource information
- Improved role-based access control with resource context

### v9 - JWT Custom Claims Hook (2025-03-07)

Added a new JWT custom claims hook that adds the following claims to the JWT:
- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of user roles with resource information
- `user_permissions`: Array of user permissions

This hook allows the application to use JWT claims for authorization instead of querying the database directly, improving performance and security.

To enable this hook:
1. Run the SQL in `fresh_hook.sql` to create the hook function
2. Go to the Supabase dashboard > Authentication > Hooks > JWT Claim Generation
3. Select the function: `public.custom_jwt_claim_hook`
4. Save the changes
5. Log out and log back in to get a new JWT with the custom claims

### v10 - Custom Access Token Hook (2025-03-07)

Added a custom access token hook that adds the following claims to the JWT:
- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of objects with role, resource_type, and resource_id
- Profile information: first_name, last_name, organization_name, profile_role

This hook combines user profile information with role assignments to provide a comprehensive set of claims for authorization.

### Steps to Enable
1. Run the SQL script: `packages/server/src/migrations/multi-tenant/jwt_hook/08_create_custom_access_token_hook.sql`
2. In the Supabase dashboard, navigate to Authentication > Hooks (Beta)
3. In the "Custom Access Token" section, select the `public.custom_access_token_hook` function
4. Click "Save"
5. Log out and log back in to get a new JWT with these claims

### Benefits
- Improved authorization by having role information directly in the JWT
- Reduced database queries by having profile information in the JWT
- Better security by having platform admin status in the JWT
- Resource-based access control with resource_type and resource_id in the roles

## v1_custom_access_token_hook.sql - [Date: YYYY-MM-DD]
- Initial versioned implementation of the custom_access_token_hook
- Based on the original working version
- Includes user profile metadata (first_name, last_name, organization)
- Includes RBAC roles and admin status

## v2_custom_access_token_hook.sql - [Date: YYYY-MM-DD]
- Updated to use the get_user_roles_direct function to get user roles
- Simplified role handling by using the direct function instead of multiple queries
- Improved admin detection by checking the base_role and context_type in the roles array
- Removed custom_roles as they are now included in the roles array from get_user_roles_direct

## v3_custom_access_token_hook.sql - [Date: YYYY-MM-DD]
- Added functionality to update user_metadata in auth.users table
- Extracts base_role from platform roles and sets it in user_metadata
- Adds user_role to claims for backward compatibility
- Grants UPDATE permission on auth.users to supabase_auth_admin

## v4_custom_access_token_hook.sql - [Date: YYYY-MM-DD]
- Improved user metadata update by first fetching current metadata
- Removed debugging log statements for cleaner execution
- More robust handling of metadata updates
- Works with the fixed RLS policies to avoid circular dependencies

## v5_custom_access_token_hook.sql

**Date:** 2023-03-05

**Changes:**
- Enhanced superadmin detection to ensure platform admins are properly identified
- Added explicit check for 'superadmin' role in user metadata
- Improved handling of base_role assignment for superadmins
- Ensured superadmins are always marked as platform_admin in user_role
- Added direct update to auth.users table to ensure UI reflects correct role
- Fixed issue where superadmins might not have access to global context

## v1_platform_admin_jwt_claim.sql - 2023-07-XX
- Added `platform_admin` claim to JWT for platform admins
- Updated RLS policy for applications table to use the new claim
- This ensures platform admins can correctly see and manage all applications
- The claim is set to true if any of these conditions are met:
  - app_metadata.is_platform_admin is true
  - user_metadata.role is 'platform_admin'
  - user_metadata.role is 'superadmin'

## v6_custom_access_token_hook.sql - 2024-07-03

**Changes:**
- Combined functionality of v5_custom_access_token_hook and v1_platform_admin_jwt_claim
- Added platform_admin claim to JWT for RLS policies
- Ensured all necessary claims are included in a single hook
- Fixed issue with platform admins not seeing all applications
- Comprehensive platform admin detection using multiple conditions:
  - User has a role with base_role='admin' and context_type='platform'
  - User has raw_user_meta_data.role='superadmin'
  - User has app_metadata.is_platform_admin=true
  - User has user_metadata.role='platform_admin' or 'superadmin'

## v7_reset_hook.sql - 2024-07-10

**Changes:**
- Completely reset the JWT hook implementation to resolve issues
- Renamed the function from `custom_access_token_hook` to `flowise_jwt_hook` for a clean slate
- Dropped all existing hooks and functions to avoid conflicts
- Simplified the implementation to focus on core functionality:
  - Adding first_name and last_name from user_profiles.meta
  - Adding platform_admin claim for RLS policies
  - Adding test_claim to verify hook is working
- Added more robust error handling with specific EXCEPTION blocks
- Created a debug table (hook_debug_logs) to track hook execution
- Explicitly set the enabled flag to true when registering the hook
- Simplified platform admin detection logic

## v8_resource_auth_hook.sql - 2024-07-11

**Changes:**
- Added support for resource-based access control
- Enhanced JWT claims to include resource information (resource_type and resource_id)
- Added user_roles array to JWT claims with role, resource_type, and resource_id
- Improved platform admin detection
- Added test_claim with value 'v8_resource_hook' to verify hook is working
- Works with the new resource fields added to user_custom_roles table

## 2024-07-03: Updated Custom Access Token Hook

- Modified the `custom_access_token_hook` function to properly handle the `role` claim
- Added support for reading `role` from `user_metadata` and setting it in the JWT claims
- Changed function to `SECURITY DEFINER` with explicit search path for better security
- Added logic to set `is_platform_admin` based on user metadata role
- Fixed issue where platform admin status wasn't being properly reflected in the JWT

## v11_authorize_function_fix.sql - 2024-07-XX

**Changes:**
- Fixed the `authorize` function to use the correct column names in the `role_permissions` table
- Added a new `platform.global` permission for platform-wide access
- Assigned the `platform.global` permission to the `platform_admin` role
- Created an RLS policy on the `applications` table to allow users with the `platform.global` permission to view all applications
- Created the `get_all_applications_direct` function for bypassing RLS in the ApplicationController

**Benefits:**
- Platform admins can now properly see all applications through RLS policies
- The `authorize` function now correctly checks permissions against the database schema
- More granular permission control with the new `platform.global` permission
- Improved security by using proper column names and joins in the authorization function