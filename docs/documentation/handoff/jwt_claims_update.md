# JWT Claims Update: Adding User ID and Organization ID

## Overview

We've enhanced the JWT claims in our custom access token hook to include direct access to the user's ID and primary organization ID. This update simplifies client-side access to these important identifiers without requiring additional database queries.

## Current JWT Structure

Our JWT tokens now include the following claims:

```json
{
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1741489266
    }
  ],
  "app_metadata": {
    "provider": "email",
    "providers": [
      "email"
    ]
  },
  "aud": "authenticated",
  "email": "user@example.com",
  "exp": 1741492866,
  "first_name": "John",
  "iat": 1741489266,
  "is_anonymous": false,
  "is_platform_admin": true,
  "iss": "https://voksjtjrshonjadwjozt.supabase.co/auth/v1",
  "last_name": "Doe",
  "organization_name": "Example Org",
  "organizationId": "a4233773-4128-4149-82a1-75db25dd460f",
  "phone": "",
  "profile_role": "platform_admin",
  "role": "authenticated",
  "session_id": "71203482-924a-4686-865e-311234351f3a",
  "sub": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
  "test_claim": "CUSTOM_ACCESS_TOKEN_HOOK_WORKING",
  "userId": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
  "user_metadata": {
    "email_verified": true,
    "role": "platform_admin"
  },
  "user_roles": [
    {
      "resource_id": null,
      "resource_type": null,
      "role": "platform_admin"
    }
  ],
  "org_debug_info": {
    "org_lookup_started": "true",
    "org_id_from_profile": "a4233773-4128-4149-82a1-75db25dd460f",
    "org_id_found": "true"
  }
}
```

## Key Claims

### Standard Claims
- `sub`: The subject identifier (user ID) assigned by Supabase
- `aud`: The audience for the token ("authenticated")
- `iss`: The issuer of the token (Supabase Auth URL)
- `exp`: Expiration time
- `iat`: Issued at time

### Custom Claims
- `userId`: Direct copy of the user's UUID from the `sub` claim for easier access
- `organizationId`: The user's primary organization ID
- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of objects with role, resource_type, and resource_id
- `first_name`, `last_name`, `organization_name`: User profile information
- `profile_role`: The user's role from their profile
- `test_claim`: A test claim to verify the hook is working

### Debug Information (Debug Hook Only)
- `org_debug_info`: Object containing debugging information about the organization lookup process
  - `org_lookup_started`: Indicates that the organization lookup process started
  - `org_id_from_profile`: The organization ID found in the user's profile (or "null" if not found)
  - `checking_org_users`: Indicates that the hook is checking the organization_users table
  - `org_users_count`: The number of organization_users entries for this user
  - `org_id_from_org_users`: The organization ID found in the organization_users table (or "null" if not found)
  - `org_id_found`: Whether an organization ID was found

## Implementation Details

The implementation uses a custom access token hook in Supabase that adds these claims to the JWT. The hook follows this process:

1. Extract the user ID from the event
2. Add the `userId` claim (copy of the `sub` claim)
3. Check if the user is a platform admin
4. Get profile information from the `user_profiles` table
5. Get the user's primary organization ID:
   - First check `user_profiles.meta->>'organization_id'`
   - If not found, look up the first organization in `organization_users` table
6. Get user roles with resource information
7. Add all this information to the JWT claims

## Organization ID Lookup

The organization ID is retrieved using a fallback mechanism:

1. First, we check the `user_profiles.meta->>'organization_id'` field
2. If that's not found, we query the `organization_users` table for the user's first organization
3. The organization ID is stored in the `organizationId` claim as a string

To ensure this works correctly, we've:
- Granted SELECT permission on the `organization_users` table to the `supabase_auth_admin` role
- Added error handling to gracefully handle permission issues
- Added the organization ID to the user's profile meta field as a fallback

## Usage in Client Applications

Client applications can directly access these values from the decoded JWT:

```javascript
// Get the current session
const session = supabase.auth.getSession();

// Access the JWT claims
const { access_token } = session.data.session;

// Decode the JWT
import { jwtDecode } from 'jwt-decode';
const decodedToken = jwtDecode(access_token);

// Access the user ID and organization ID
const userId = decodedToken.userId;
const organizationId = decodedToken.organizationId;
const isPlatformAdmin = decodedToken.is_platform_admin;
const userRoles = decodedToken.user_roles;

// Use these values in API calls
const response = await fetch(`/api/organizations/${organizationId}/users/${userId}`);
```

## Troubleshooting

If the claims are not appearing in the JWT:

1. Verify that the user has logged out and logged back in
2. Check for any error messages in the JWT claims (e.g., `organization_error`)
3. Ensure the user has a valid organization association in the database
4. Verify that the hook is properly registered in the Supabase dashboard

For organization ID issues specifically:
1. Check if the user has an entry in the `organization_users` table
2. Check if the user's profile has an `organization_id` in the meta field
3. Verify that the `supabase_auth_admin` role has SELECT permission on the `organization_users` table
4. Use the debug hook to get detailed information about the organization lookup process

## Version History

- **v12.1**: Fixed permission issues with organization_users table and improved error handling
- **v12**: Added userId and organizationId claims to the JWT
- **v11**: Fixed the authorize function to use correct column names
- **v8-v10**: Added resource-based access control and improved platform admin detection
- **v1-v7**: Initial implementations with progressive improvements 