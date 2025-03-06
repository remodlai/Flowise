# JWT Custom Claims Hook

This directory contains the SQL files needed to create and register a JWT custom claims hook in Supabase.

## What is a JWT Custom Claims Hook?

A JWT Custom Claims Hook is a PostgreSQL function that runs whenever a new JWT token is generated. It allows you to add custom claims to the JWT token, which can be used for authorization and other purposes.

## Files

- `01_register_jwt_hook.sql`: Contains instructions for registering the JWT hook in the Supabase dashboard.
- `fresh_hook.sql`: Contains the SQL to create the JWT hook function.

## How to Use

1. Run the SQL in `fresh_hook.sql` to create the hook function:
   ```bash
   psql -h your-supabase-host -U postgres -d postgres -f fresh_hook.sql
   ```

2. Go to the Supabase dashboard:
   - Navigate to Authentication > Hooks > JWT Claim Generation
   - Select the function: `public.custom_jwt_claim_hook`
   - Save the changes

3. Log out and log back in to get a new JWT with the custom claims.

## Custom Claims

The hook adds the following claims to the JWT:

- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of user roles with resource information
- `user_permissions`: Array of user permissions
- `test_claim`: A test claim to verify the hook is working

## Debugging

To enable JWT claims debugging, set the `DEBUG_JWT` environment variable to `true`:

```
DEBUG_JWT=true
```

This will log the JWT claims to the console for each API request. 