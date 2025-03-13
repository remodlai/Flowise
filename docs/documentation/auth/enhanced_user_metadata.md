# Enhanced User Metadata

This document describes the enhanced user metadata system implemented in the platform, which allows for storing and accessing additional information about users in the JWT claims.

## Overview

The platform now supports storing and accessing the following metadata for users:

1. **Basic User Information**
   - First name
   - Last name
   - User status (active, pending, suspended)

2. **Service User Flag**
   - `is_service_user` - Indicates if the user is a service user

3. **Application Context**
   - Application ID
   - Application name

4. **Organization Context**
   - Organization ID
   - Organization name

5. **Creator Information**
   - Creator user ID
   - Creator first name
   - Creator last name

## Implementation Status

The enhanced user metadata system has been successfully implemented and deployed. The custom access token hook now adds the metadata to JWT claims, which can be accessed in application code.

### Verification Results

The JWT token now includes the following additional claims:

```json
{
  "is_service_user": false,
  "user_status": "active",
  "application": {
    "id": "global",
    "name": "Global"
  },
  "organization": {
    "id": "a4233773-4128-4149-82a1-75db25dd460f",
    "name": "Remodl AI"
  },
  "first_name": "Brian",
  "last_name": "Bagdasarian",
  "test_claim": "v9_enhanced_metadata"
}
```

These claims can now be used for authorization decisions and UI customization. The hook also maintains backward compatibility with existing claims like `organizationId` and `organization_name`.

## Setting User Metadata

### When Creating a User

When creating a user through the Supabase Auth API, you can set the metadata fields:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      status: 'active', // 'active', 'pending', or 'suspended'
      application_id: '123e4567-e89b-12d3-a456-426614174000',
      application_name: 'My Application',
      organization_id: '123e4567-e89b-12d3-a456-426614174001',
      organization_name: 'My Organization',
      // For service users only:
      is_service_user: true,
      created_by: '123e4567-e89b-12d3-a456-426614174002', // User ID of creator
      creator_first_name: 'Admin',
      creator_last_name: 'User'
    }
  }
});
```

### When Creating a Service User

Service users should have the `is_service_user` flag set to `true` and include information about who created them:

```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'service-user@example.com',
  password: 'secure-password',
  user_metadata: {
    is_service_user: true,
    status: 'active',
    application_id: '123e4567-e89b-12d3-a456-426614174000',
    application_name: 'My Application',
    organization_id: '123e4567-e89b-12d3-a456-426614174001',
    organization_name: 'My Organization',
    created_by: '123e4567-e89b-12d3-a456-426614174002', // User ID of creator
    creator_first_name: 'Admin',
    creator_last_name: 'User'
  }
});
```

### Updating User Metadata

You can update a user's metadata using the `updateUser` method:

```typescript
const { data, error } = await supabase.auth.updateUser({
  data: {
    status: 'suspended',
    application_id: '123e4567-e89b-12d3-a456-426614174003',
    application_name: 'New Application'
  }
});
```

## Accessing User Metadata in JWT Claims

The custom access token hook automatically adds the metadata to the JWT claims, which can be accessed in your application code.

### In Frontend Code

```typescript
// Get the current user's JWT claims
const { data: { session } } = await supabase.auth.getSession();
const claims = session?.access_token ? jwtDecode(session.access_token) : null;

// Check if user is a service user
const isServiceUser = claims?.is_service_user || false;

// Get user status
const userStatus = claims?.user_status || 'active';

// Get application information
const applicationId = claims?.application?.id;
const applicationName = claims?.application?.name;

// Get organization information
const organizationId = claims?.organization?.id;
const organizationName = claims?.organization?.name;

// Get creator information
const creatorId = claims?.creator?.id;
const creatorFirstName = claims?.creator?.first_name;
const creatorLastName = claims?.creator?.last_name;
```

### In Backend Code

In Express middleware or route handlers, you can access the JWT claims from the request object:

```typescript
// Assuming you're using the supabase-auth-helpers middleware
app.get('/protected-route', (req, res) => {
  const claims = req.auth.claims;
  
  // Check if user is a service user
  const isServiceUser = claims.is_service_user || false;
  
  // Check user status
  if (claims.user_status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended' });
  }
  
  // Use application or organization context
  const applicationId = claims.application?.id;
  const organizationId = claims.organization?.id;
  
  // Continue with the request...
});
```

## Using Metadata for Authorization

You can use the metadata for authorization decisions in your application:

```typescript
// Check if user is active
if (claims.user_status !== 'active') {
  return res.status(403).json({ error: 'Account not active' });
}

// Check if user belongs to the correct application
if (claims.application?.id !== requestedApplicationId) {
  return res.status(403).json({ error: 'Not authorized for this application' });
}

// Special handling for service users
if (claims.is_service_user) {
  // Allow service users to perform certain operations
  // ...
}
```

## Database Schema

The metadata is stored in the `raw_user_meta_data` column of the `auth.users` table. This is a JSONB column that can store arbitrary JSON data.

## Implementation Details

The custom access token hook (`public.custom_access_token_hook`) reads the metadata from the `auth.users` table and adds it to the JWT claims. The hook is triggered whenever a new JWT token is generated, such as during login or token refresh.

The hook also reads data from the `public.user_profiles` table if it exists, allowing for additional profile data to be included in the JWT claims.

## Best Practices

1. **Validate Metadata**: Always validate metadata when setting it to ensure it meets your application's requirements.

2. **Keep Metadata Small**: JWT tokens have size limitations, so keep metadata concise.

3. **Security Considerations**: Don't store sensitive information in metadata, as it will be included in the JWT token.

4. **Update Regularly**: Keep metadata up to date, especially for fields like user status that may change over time.

5. **Handle Missing Data**: Always handle cases where metadata might be missing or null in your application code. 