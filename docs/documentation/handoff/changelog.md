# User Routes Changelog

## March 2025

### User Roles Array Fix

**Date**: March 14, 2025  
**Author**: Brian Bagdasarian  
**PR**: #126  

#### Changes

1. **Fixed Empty Roles Array Issue**
   - Updated the `formatUserResponse` method to ensure the user's primary role is included in the roles array
   - Added logic to check if the role already exists in the array before adding it
   - Ensured consistent role information across all user endpoints

2. **Improved Role Representation**
   - Standardized the format of role objects in the roles array
   - Added resource_type and resource_id information for each role
   - Maintained backward compatibility with existing role handling

#### Motivation

These changes were implemented to:
- Fix an issue where the roles array was empty even when a user had a defined role
- Ensure consistent role information across all user endpoints
- Provide more detailed role information for authorization checks
- Maintain a standardized response format for all user-related endpoints

#### Affected Files

- `packages/server/src/controllers/UserController.ts`

#### Documentation

Updated documentation can be found in:
- [User Routes and Controller Documentation](./user_routes.md)

### Platform Admin Role Detection Fix

**Date**: March 13, 2025  
**Author**: Brian Bagdasarian  
**PR**: #125  

#### Changes

1. **Fixed Platform Admin Detection**
   - Updated the logic to correctly identify platform admin users based on their role
   - Added check for `role === 'platform_admin'` when determining platform admin status
   - Standardized the approach across all user retrieval methods

2. **Improved Naming Consistency**
   - Standardized response field naming to use camelCase consistently
   - Changed `is_platform_admin` to `isPlatformAdmin` in responses
   - Changed `is_service_user` to `isServiceUser` in responses

#### Motivation

These changes were implemented to:
- Fix an issue where platform admin users were incorrectly identified as non-admin
- Ensure consistent identification of platform admin users across all endpoints
- Standardize naming conventions in API responses for better client integration
- Properly handle service key authentication while preserving user role information

#### Affected Files

- `packages/server/src/controllers/UserController.ts`

#### Documentation

Updated documentation can be found in:
- [User Routes and Controller Documentation](./user_routes.md)

### User Route Path Updates

**Date**: March 13, 2025  
**Author**: Brian Bagdasarian  
**PR**: #124  

#### Changes

1. **Updated User Route Paths**
   - Changed user routes from `/global/users` to `/platform/users` for consistency
   - Updated documentation to reflect the new route paths
   - Added dedicated section for service user routes in documentation

2. **Enhanced Organization Mapping in User Responses**
   - Added logic to populate the organizations array when it's empty but organization info exists
   - Ensures consistent organization data format across all user endpoints
   - Applied to all user retrieval methods (getAllUsers, getAllServiceUsers, getUserById)

#### Motivation

These changes were implemented to:
- Maintain consistent naming conventions across the API
- Ensure proper organization data is always available in user responses
- Improve documentation clarity for different user route types

#### Affected Files

- `packages/server/src/controllers/UserController.ts`
- `packages/server/src/routes/api.ts`
- `docs/documentation/handoff/user_routes.md`

#### Documentation

Updated documentation can be found in:
- [User Routes and Controller Documentation](./user_routes.md)

### User Routes and Controller Enhancements

**Date**: March 12, 2025  
**Author**: Brian Bagdasarian  
**PR**: #123  

#### Changes

1. **Consolidated Organization Member Methods**
   - Combined `updateOrganizationMemberRole` and `updateOrganizationMember` into a single method
   - Added detection of admin role updates based on request path or query parameters
   - Improved response format to include information about the operation type

2. **Enhanced User Retrieval with Auth Admin API**
   - Replaced direct queries to `auth.users` table with Supabase Auth Admin API
   - Implemented in-memory filtering for application and organization scopes
   - Added support for multiple metadata formats for application and organization IDs
   - Improved error handling with proper try/catch blocks

3. **Standardized API Routes**
   - Removed `/create` suffixes from POST endpoints
   - Simplified update and delete routes to use consistent patterns
   - Standardized user routes to use `/users/:userId` consistently
   - Made application and organization routes follow the same pattern
   - Ensured service user routes follow the same pattern across different contexts

#### Motivation

These changes were implemented to:
- Improve code maintainability by reducing duplication
- Enhance security by using the Auth Admin API instead of direct database queries
- Provide a more consistent and intuitive API for frontend developers
- Support the multi-tenant architecture with proper context-based access control

#### Affected Files

- `packages/server/src/controllers/UserController.ts`
- `packages/server/src/controllers/OrganizationController.ts`
- `packages/server/src/routes/api.ts`

#### Documentation

Comprehensive documentation for these changes can be found in:
- [User Routes and Controller Documentation](./user_routes.md)

## Previous Changes

(Previous changelog entries would go here) 