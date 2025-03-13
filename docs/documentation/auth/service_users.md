# Service Users

This document describes the concept of service users in the platform, how to create them, and how to use them for automated tasks and integrations.

## What are Service Users?

Service users are special user accounts that are not associated with real people but are used for automated tasks, integrations, and system operations. They are identified by the `is_service_user` flag in their metadata.

Key characteristics of service users:

1. They are not meant to be used by humans
2. They typically have specific, limited permissions
3. They are associated with a specific application or organization
4. They are created by an administrator or another service
5. They can be used for API access, background jobs, or integrations

## Implementation Status

The infrastructure for service users has been implemented in the custom access token hook. The hook now adds the `is_service_user` flag to JWT claims, which can be used to identify service users in application code.

### Next Steps

The following tasks are still pending for full service user implementation:

1. Create a dedicated API endpoint for creating service users
2. Add UI components for managing service users in the admin panel
3. Implement security measures for service user credentials
4. Update authorization middleware to handle service users
5. Add logging for service user activities

## Creating Service Users

Service users can be created using the Supabase Auth Admin API:

```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'service-user@example.com',
  password: generateSecurePassword(), // Generate a secure random password
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

### Best Practices for Service User Creation

1. **Use a Dedicated Email Format**: Use a consistent email format for service users, such as `service-{purpose}@yourdomain.com`
2. **Generate Strong Passwords**: Use a secure random password generator
3. **Store Credentials Securely**: Store service user credentials in a secure location, such as a secrets manager
4. **Limit Permissions**: Give service users only the permissions they need
5. **Document Purpose**: Include a clear description of the service user's purpose in the metadata
6. **Associate with Application/Organization**: Always associate service users with a specific application or organization

## Using Service Users

Service users can be used in various ways:

### For API Access

```typescript
// Authenticate as a service user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'service-user@example.com',
  password: 'secure-password'
});

// Use the service user's JWT token for API requests
const { data: apiData } = await fetch('https://api.example.com/data', {
  headers: {
    Authorization: `Bearer ${data.session.access_token}`
  }
});
```

### For Background Jobs

```typescript
// In a background job
async function runBackgroundJob() {
  // Authenticate as a service user
  const { data } = await supabase.auth.signInWithPassword({
    email: 'service-user@example.com',
    password: 'secure-password'
  });
  
  // Use the service user's JWT token for operations
  const { error } = await supabase
    .from('data_processing_jobs')
    .insert({ status: 'completed', processed_at: new Date() });
}
```

### For Integrations

```typescript
// In an integration with a third-party service
async function syncWithExternalService() {
  // Authenticate as a service user
  const { data } = await supabase.auth.signInWithPassword({
    email: 'service-user@example.com',
    password: 'secure-password'
  });
  
  // Fetch data from external service
  const externalData = await fetchFromExternalService();
  
  // Use the service user's JWT token to update internal data
  const { error } = await supabase
    .from('external_data_sync')
    .upsert(externalData);
}
```

## Identifying Service Users

The platform automatically adds the `is_service_user` flag to the JWT claims for service users. You can use this flag to identify service users in your application code:

```typescript
// In an API endpoint
app.get('/api/data', (req, res) => {
  const claims = req.auth.claims;
  
  // Check if the request is from a service user
  const isServiceUser = claims.is_service_user || false;
  
  if (isServiceUser) {
    // Handle service user requests differently
    // For example, bypass rate limiting or allow bulk operations
  }
  
  // Continue with the request...
});
```

## Managing Service Users

### Updating Service Users

You can update a service user's metadata using the `updateUser` method:

```typescript
const { data, error } = await supabase.auth.updateUser({
  data: {
    status: 'suspended', // Suspend a service user
    application_id: '123e4567-e89b-12d3-a456-426614174003', // Update application association
  }
});
```

### Deleting Service Users

When a service user is no longer needed, it should be deleted:

```typescript
const { error } = await supabase.auth.admin.deleteUser(
  '123e4567-e89b-12d3-a456-426614174004' // Service user ID
);
```

## Security Considerations

1. **Rotate Credentials**: Regularly rotate service user passwords
2. **Monitor Activity**: Monitor service user activity for unusual patterns
3. **Audit Access**: Regularly audit service user permissions
4. **Limit Scope**: Limit service users to specific resources and operations
5. **Revoke Access**: Promptly revoke access for unused service users

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Ensure the service user's credentials are correct and the account is active
2. **Permission Denied**: Check that the service user has the necessary permissions
3. **Token Expiration**: Handle token refresh for long-running operations
4. **Rate Limiting**: Be aware of rate limits that may affect service users

### Debugging Tips

1. **Check JWT Claims**: Decode the JWT token to verify the claims
2. **Verify Metadata**: Check the service user's metadata in the Supabase dashboard
3. **Test Authentication**: Test authentication separately from the main operation
4. **Check Logs**: Review logs for authentication and authorization errors 