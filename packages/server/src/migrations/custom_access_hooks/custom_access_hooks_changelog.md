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