# Registering the Custom Access Token Hook

## Steps to Register the Hook

1. Log in to the Supabase dashboard.
2. Navigate to Authentication > Hooks (Beta).
3. In the "Custom Access Token" section, select the `public.custom_access_token_hook` function from the dropdown.
4. Click "Save."

## Testing the Hook

After registering the hook, users must log out and log back in to receive a new JWT with the added claims. The JWT should include:

- `test_claim`: "CUSTOM_ACCESS_TOKEN_HOOK_WORKING"
- `is_platform_admin`: true/false
- `user_roles`: An array of objects with:
  - `role`: The name of the role (mapped from the `name` column in the `roles` table)
  - `resource_type`: The type of resource the role applies to
  - `resource_id`: The ID of the resource the role applies to
- Profile information:
  - `first_name`
  - `last_name`
  - `organization_name`
  - `profile_role`

## SQL Reference (Do Not Execute)

Note: The hook cannot be registered via SQL in Supabase. This is for reference only.

```sql
-- This is for reference only. Registration must be done through the Supabase dashboard.
SELECT
  coalesce(
    (SELECT setting FROM pg_settings WHERE name = 'app.settings.jwt_secret'),
    (SELECT setting FROM pg_settings WHERE name = 'pgrst.jwt_secret')
  ) as jwt_secret,
  (SELECT setting FROM pg_settings WHERE name = 'app.settings.jwt_exp') as jwt_exp;

ALTER SYSTEM SET app.settings.auth.hooks.custom_access_token_hook.function_name = 'public.custom_access_token_hook';
``` 