-- Drop existing hook functions
DROP FUNCTION IF EXISTS public.minimal_jwt_hook;
DROP FUNCTION IF EXISTS public.debug_jwt_hook;
DROP FUNCTION IF EXISTS public.custom_jwt_claim_hook;
DROP FUNCTION IF EXISTS public.test_debug_hook;

-- Log the dropped functions
RAISE NOTICE 'Dropped existing hook functions'; 