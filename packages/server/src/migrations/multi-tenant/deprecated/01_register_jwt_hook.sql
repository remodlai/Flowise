-- Register the JWT hook in the auth.hooks table
-- This needs to be run manually in the Supabase dashboard
-- Go to Authentication > Hooks > JWT Claim Generation
-- Select the function: public.custom_jwt_claim_hook

-- This is just a reference for the SQL that would be executed
-- when you register the hook through the Supabase dashboard
/*
INSERT INTO auth.hooks (hook_name, hook_function_name)
VALUES ('jwt_claim_generation', 'public.custom_jwt_claim_hook');
*/

-- Note: The above SQL is for reference only and should NOT be executed directly.
-- Always use the Supabase dashboard to register JWT hooks. 