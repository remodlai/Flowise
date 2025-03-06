-- Create a minimal hook function for testing
create or replace function public.minimal_hook(event jsonb)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  claims jsonb;
begin
  -- Get the original claims
  claims := event->'claims';
  
  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{minimal_test}', '"MINIMAL_HOOK_WORKING"');
  
  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  return event;
end;
$$;

-- Grant necessary permissions
grant execute
  on function public.minimal_hook
  to supabase_auth_admin;

revoke execute
  on function public.minimal_hook
  from authenticated, anon, public; 