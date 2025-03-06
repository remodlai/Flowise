# Testing RLS Policies

## Overview

This document provides guidance on testing Row Level Security (RLS) policies in the Remodl AI platform. Proper testing is essential to ensure that your security policies work as expected and that users can only access the data they are authorized to see.

## Testing Approaches

### 1. Direct SQL Testing

The most straightforward way to test RLS policies is to use SQL directly in the database, simulating different user contexts.

#### Setting Up the Test Environment

```sql
-- Start a transaction so we can roll back changes
BEGIN;

-- Set the role to authenticated (required for RLS)
SET LOCAL role authenticated;

-- Set JWT claims to simulate a specific user
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": false,
  "user_roles": [
    {
      "role": "app_admin",
      "resource_type": "application",
      "resource_id": "test-app-id"
    }
  ]
}';

-- Run your test queries
SELECT * FROM applications;
SELECT * FROM application_chatflows;

-- Roll back the transaction to clean up
ROLLBACK;
```

#### Testing Different User Roles

```sql
-- Test as platform admin
BEGIN;
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": true,
  "user_roles": [
    {
      "role": "platform_admin",
      "resource_type": null,
      "resource_id": null
    }
  ]
}';

-- Run test queries
SELECT * FROM applications;
ROLLBACK;

-- Test as application admin
BEGIN;
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": false,
  "user_roles": [
    {
      "role": "app_admin",
      "resource_type": "application",
      "resource_id": "test-app-id"
    }
  ]
}';

-- Run test queries
SELECT * FROM applications;
ROLLBACK;

-- Test as organization admin
BEGIN;
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": false,
  "user_roles": [
    {
      "role": "org_admin",
      "resource_type": "organization",
      "resource_id": "test-org-id"
    }
  ]
}';

-- Run test queries
SELECT * FROM applications;
ROLLBACK;
```

### 2. Using pgTAP for Automated Testing

[pgTAP](https://pgtap.org/) is a unit testing framework for PostgreSQL that can be used to automate RLS policy testing.

#### Example pgTAP Test

```sql
-- Create a pgTAP test file
BEGIN;
SELECT plan(3);

-- Test platform admin access
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": true,
  "user_roles": [{"role": "platform_admin"}]
}';

SELECT results_eq(
  'SELECT COUNT(*) FROM applications',
  'SELECT COUNT(*) FROM applications WHERE true',
  'Platform admin should see all applications'
);

-- Test app admin access
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": false,
  "user_roles": [{"role": "app_admin", "resource_type": "application", "resource_id": "test-app-id"}]
}';

SELECT results_eq(
  'SELECT COUNT(*) FROM applications',
  'SELECT COUNT(*) FROM applications WHERE id = ''test-app-id''',
  'App admin should only see their application'
);

-- Test regular user access
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{
  "sub": "test-user-id",
  "is_platform_admin": false,
  "user_roles": []
}';

SELECT results_eq(
  'SELECT COUNT(*) FROM applications',
  'SELECT 0',
  'Regular user should see no applications'
);

SELECT * FROM finish();
ROLLBACK;
```

### 3. Testing with Supabase Client

You can also test RLS policies using the Supabase client in your application code.

#### JavaScript Example

```javascript
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Test as a specific user
async function testAsUser(email, password) {
  // Sign in as the user
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    return;
  }
  
  // Test queries
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select('*');
  
  console.log('Applications visible to user:', applications);
  
  // Sign out
  await supabase.auth.signOut();
}

// Run tests
async function runTests() {
  await testAsUser('platform-admin@example.com', 'password');
  await testAsUser('app-admin@example.com', 'password');
  await testAsUser('regular-user@example.com', 'password');
}

runTests();
```

## Common Testing Scenarios

### 1. Testing Platform Admin Access

Platform admins should have access to all resources. Test that they can:

- View all applications
- View all organizations
- View all users
- Manage all resources

### 2. Testing Application Admin Access

Application admins should only have access to their application and its resources. Test that they can:

- View their application
- Manage resources within their application
- Cannot access other applications

### 3. Testing Organization Admin Access

Organization admins should only have access to their organization and its resources. Test that they can:

- View their organization
- Manage resources within their organization
- Cannot access other organizations

### 4. Testing Regular User Access

Regular users should only have access to resources they are explicitly granted access to. Test that they can:

- View resources they have permission to view
- Cannot access resources they don't have permission for

### 5. Testing Resource-Specific Permissions

Test that users with resource-specific permissions can only access those specific resources:

- User with chatflow.view permission for a specific application can only view chatflows in that application
- User with org.edit permission for a specific organization can only edit that organization

## Troubleshooting RLS Issues

### 1. Policy Not Applied

If a policy is not being applied as expected, check:

- Is the policy enabled?
- Is the policy correctly defined (using vs. with check)?
- Is the policy for the correct operation (SELECT, INSERT, UPDATE, DELETE)?
- Is the policy for the correct role (authenticated, anon, etc.)?

### 2. JWT Claims Not Available

If JWT claims are not available in RLS policies, check:

- Is the custom access token hook properly registered?
- Is the user authenticated?
- Are the claims being set correctly in the hook?

### 3. Function Errors

If RLS functions are causing errors, check:

- Are the function parameters correct?
- Are the function dependencies (tables, other functions) available?
- Are there any syntax errors in the function?

## Best Practices for RLS Testing

1. **Test All User Roles**: Test with all possible user roles to ensure policies work correctly for everyone.

2. **Test Edge Cases**: Test with users who have multiple roles, no roles, or special permissions.

3. **Automate Tests**: Use pgTAP or application tests to automate RLS testing.

4. **Test After Changes**: Re-test RLS policies after making changes to the database schema or policies.

5. **Use Transactions**: Always use transactions (BEGIN/ROLLBACK) when testing to avoid modifying production data.

6. **Log Test Results**: Keep logs of test results to track changes over time.

7. **Test in Isolation**: Test each policy in isolation to identify specific issues.

## References

- [Supabase Testing Documentation](https://supabase.com/docs/guides/database/testing)
- [pgTAP Documentation](https://pgtap.org/)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) 