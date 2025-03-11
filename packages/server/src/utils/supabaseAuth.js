"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomAccessTokenHook = exports.authenticateUser = void 0;
const supabase_1 = require("./supabase");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to authenticate user with Supabase
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Skip authentication for public routes and login-related routes
        if (req.path.includes('/public/') ||
            req.path === '/login' ||
            req.path === '/auth/login' ||
            req.path === '/auth/magic-link' ||
            req.path.includes('/auth/callback') ||
            req.path.includes('/node-icon/')) {
            return next();
        }
        // Skip Supabase authentication if the user is already authenticated via API key
        if (req.user && req.user.provider === 'api-key') {
            return next();
        }
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized Access' });
            return;
        }
        // Extract the token
        const token = authHeader.split(' ')[1];
        // Decode the JWT to get claims
        let decodedJwt = null;
        try {
            decodedJwt = jsonwebtoken_1.default.decode(token);
            console.log('========== DECODED JWT ==========');
            // console.log(JSON.stringify(decodedJwt, null, 2))
            console.log('=================================');
        }
        catch (jwtError) {
            console.error('Error decoding JWT:', jwtError);
        }
        // Validate the token with Supabase Auth
        const { data, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !data.user) {
            console.error('Token validation error:', error);
            res.status(401).json({ error: 'Invalid authentication token' });
            return;
        }
        // Set the user object on the request
        const user = {
            userId: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider || 'email',
            userMetadata: data.user.user_metadata || {},
            app_metadata: data.user.app_metadata || {}
        };
        // Add JWT claims to the user object
        if (decodedJwt) {
            // Add platform admin status from JWT claim
            user.is_platform_admin = decodedJwt.is_platform_admin === true;
            // Add user roles from JWT claim
            user.user_roles = decodedJwt.user_roles || [];
            // Add profile information from JWT claims
            user.first_name = decodedJwt.first_name;
            user.last_name = decodedJwt.last_name;
            user.organization_name = decodedJwt.organization_name;
            user.profile_role = decodedJwt.profile_role;
            // Add test claim
            user.test_claim = decodedJwt.test_claim;
            // For backward compatibility
            user.isPlatformAdmin = user.is_platform_admin;
        }
        else {
            // Fallback to old method if JWT decoding fails
            user.isPlatformAdmin = data.user.app_metadata?.is_platform_admin ||
                data.user.user_metadata?.role === 'platform_admin' ||
                data.user.user_metadata?.role === 'superadmin';
            user.is_platform_admin = user.isPlatformAdmin;
        }
        console.log('User authenticated:', {
            userId: data.user.id,
            isPlatformAdmin: user.isPlatformAdmin,
            is_platform_admin: user.is_platform_admin,
            userRolesCount: user.user_roles?.length || 0,
            first_name: user.first_name,
            last_name: user.last_name
        });
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Server error during authentication' });
        return;
    }
};
exports.authenticateUser = authenticateUser;
/**
 * SQL function to add custom claims to JWT
 * This needs to be executed in your Supabase database
 */
exports.createCustomAccessTokenHook = `
-- Create the auth hook function
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_metadata jsonb;
begin
  -- Get the user metadata from the users table or any other source
  select meta into user_metadata 
  from public.user_profiles 
  where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if user_metadata is not null then
    -- Add first_name
    if user_metadata->>'first_name' is not null then
      claims := jsonb_set(claims, '{first_name}', to_jsonb(user_metadata->>'first_name'));
    end if;
    
    -- Add last_name
    if user_metadata->>'last_name' is not null then
      claims := jsonb_set(claims, '{last_name}', to_jsonb(user_metadata->>'last_name'));
    end if;
    
    -- Add organization
    if user_metadata->>'organization' is not null then
      claims := jsonb_set(claims, '{organization}', to_jsonb(user_metadata->>'organization'));
    end if;
    
    -- Add role
    if user_metadata->>'role' is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_metadata->>'role'));
    end if;
  end if;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  -- Return the modified event
  return event;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;
`;
//# sourceMappingURL=supabaseAuth.js.map