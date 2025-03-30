# Custom Access Token Hook Claims Update Implementation Checklist

## Overview
Update the custom access token hook to ensure proper handling of claims in app_metadata, specifically for application_ids, organization_ids, and user_id claims.

## Requirements
- Claims must always exist in JWT
- Claims must never be null
- Empty states must be handled gracefully (empty arrays or strings)
- Token creation must never fail due to missing data
- Support future M2M functionality
- Maintain existing functionality

## Current Implementation Analysis (as of v9_enhanced_metadata)
1. User ID Handling:
   - Currently adds userId at root level of claims
   - Not duplicated in app_metadata

2. Organization ID Handling:
   - Currently adds organizationId to custom_metadata if found
   - Uses debug_info for tracking org lookup process
   - No explicit handling for empty cases
   - No organization_ids array

3. Application ID Handling:
   - Currently stores application info in app_info object
   - No application_ids array
   - No "global" handling for platform admins

4. Platform Admin Handling:
   - Checks and sets is_platform_admin flag
   - No special handling for global access

## Implementation Steps

### 1. Verification and Backup
- [x] Verify current implementation in Supabase
- [x] Document current behavior
- [x] Create SQL backup of current function

### 2. Claims Implementation
- [ ] Add application_ids array to app_metadata
  * Must always exist
  * Include "global" for platform admins
  * Default to empty array if no applications
  * Handle edge cases (new users, unverified users)

- [ ] Add organization_ids array to app_metadata
  * Must always exist
  * Default to empty array if no organizations
  * Handle edge cases (new users, unverified users)

- [ ] Duplicate user_id in app_metadata
  * Keep existing root-level user_id
  * Add copy to app_metadata
  * Ensure both locations are always populated

### 3. Testing
- [ ] Test token generation for platform admin
  * Verify "global" in application_ids
  * Verify empty arrays handled correctly

- [ ] Test token generation for regular user
  * Verify correct organization_ids
  * Verify correct application_ids

- [ ] Test edge cases
  * New user signup
  * Unverified user
  * User without organization
  * User without application
  * M2M token generation

### 4. Documentation
- [ ] Update function documentation
- [ ] Document edge case handling
- [ ] Update changelog
- [ ] Update implementation status

### 5. Verification
- [ ] Test with Zuplo endpoints
- [ ] Verify claims accessibility
- [ ] Confirm no breaking changes

## Changelog
- Created checklist (pending implementation)
- Completed Step 1.1: Verified current implementation
- Completed Step 1.2: Documented current behavior
- Created backup of current function

## Notes
- Implementation will be done step by step with approval at each stage
- Each step will be tested before proceeding
- Any issues will be documented and addressed before moving forward 