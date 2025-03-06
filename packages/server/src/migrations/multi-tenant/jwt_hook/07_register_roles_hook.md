# Registering the Roles Hook in Supabase

After creating the `roles_hook` function, you need to register it in the Supabase dashboard for it to be triggered when JWT tokens are issued or refreshed.

## Steps to Register the Hook

1. Log in to the Supabase dashboard
2. Navigate to Authentication > Hooks (Beta)
3. In the "Custom Access Token" section, select the `public.roles_hook` function from the dropdown
4. Click "Save"

## Testing the Hook

After registering the hook, you need to log out and log back in to get a new JWT with the added claims. You can verify the hook is working by checking the JWT token, which should now include:

- `test_claim`: "ROLES_HOOK_WORKING"
- `is_platform_admin`: true/false
- `user_roles`: An array of objects with role, resource_type, and resource_id

## SQL Reference (Do Not Execute)

The following SQL is for reference only and shows how the hook would be registered if done via SQL (which is not possible in Supabase):

```sql
-- This is for reference only, you cannot execute this directly
-- You must register the hook through the Supabase dashboard
INSERT INTO auth.hooks (hook_name, hook_function_name)
VALUES ('jwt_claim_generator', 'public.roles_hook');
``` 