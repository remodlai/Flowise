-- Add transaction functions needed by the Role Builder for Supabase
-- These are no-op functions that satisfy the API requirements for Supabase

-- Create the begin_transaction function
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT;
$$;

-- Create the commit_transaction function
CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT;
$$;

-- Create the rollback_transaction function
CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.begin_transaction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_transaction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_transaction() TO authenticated;

-- Grant execute permissions to anon users (if needed)
GRANT EXECUTE ON FUNCTION public.begin_transaction() TO anon;
GRANT EXECUTE ON FUNCTION public.commit_transaction() TO anon;
GRANT EXECUTE ON FUNCTION public.rollback_transaction() TO anon; 