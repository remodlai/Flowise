# Platform Implementation Plan

## Implementation Philosophy

Rather than implementing a complex external authorization schema, we'll follow an incremental approach using database Row Level Security:
1. Start with the core hierarchical structure (platform -> app -> organization)
2. Implement and test RLS policies at each level
3. Build the UI components to manage these relationships
4. Expand to more specialized features as needed

This approach provides clear visibility into authorization rules while maintaining security at the database level.

## Phase 1: Platform Admin Infrastructure

**Goal:** Establish the foundation for platform administration with RLS-based security.

### Step 1: Core Database Schema

1. **Platform Table**
   ```sql
   CREATE TABLE platform (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Insert the default platform
   INSERT INTO platform (name) VALUES ('Flowise Platform');
   ```

2. **User-Platform Relationship Table**
   ```sql
   CREATE TABLE user_platform_role (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     platform_id UUID REFERENCES platform(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('platform_owner', 'platform_admin')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, platform_id, role)
   );
   
   -- Enable RLS
   ALTER TABLE user_platform_role ENABLE ROW LEVEL SECURITY;
   
   -- Platform admin can manage all roles
   CREATE POLICY platform_admin_policy ON user_platform_role
     USING (EXISTS (
       SELECT 1 FROM user_platform_role 
       WHERE user_id = auth.uid() 
       AND role IN ('platform_owner', 'platform_admin')
     ));
     
   -- Users can view their own roles
   CREATE POLICY view_own_roles ON user_platform_role
     FOR SELECT
     USING (user_id = auth.uid());
   ```

3. **Authentication Integration**
   - Configure Supabase authentication
   - Set up JWT token generation with claims
   - Implement JWT verification middleware

### Step 2: Admin UI Framework

1. Create `/admin` route with authentication check
2. Add platform admin verification based on user_platform_role lookup
3. Implement basic admin dashboard framework

### Step 3: Platform Admin Management

1. Create UI for managing platform admins
2. Implement API to add/remove platform admins
3. Add audit logging for admin actions

## Phase 2: App Management

**Goal:** Implement app management with proper RLS policies.

### Step 1: App Database Schema

1. **App Table**
   ```sql
   CREATE TABLE app (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     platform_id UUID REFERENCES platform(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE app ENABLE ROW LEVEL SECURITY;
   
   -- Platform admins can manage all apps
   CREATE POLICY platform_admin_app_policy ON app
     USING (EXISTS (
       SELECT 1 FROM user_platform_role 
       WHERE user_id = auth.uid() 
       AND role IN ('platform_owner', 'platform_admin')
     ));
   ```

2. **User-App Relationship Table**
   ```sql
   CREATE TABLE user_app_role (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     app_id UUID REFERENCES app(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('app_owner', 'app_admin')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, app_id, role)
   );
   
   -- Enable RLS
   ALTER TABLE user_app_role ENABLE ROW LEVEL SECURITY;
   
   -- Platform admins can manage all app roles
   CREATE POLICY platform_admin_app_role_policy ON user_app_role
     USING (EXISTS (
       SELECT 1 FROM user_platform_role 
       WHERE user_id = auth.uid() 
       AND role IN ('platform_owner', 'platform_admin')
     ));
   
   -- App owners/admins can view their app's roles
   CREATE POLICY app_admin_view_roles ON user_app_role
     FOR SELECT
     USING (EXISTS (
       SELECT 1 FROM user_app_role 
       WHERE user_id = auth.uid() 
       AND app_id = user_app_role.app_id 
       AND role IN ('app_owner', 'app_admin')
     ));
   
   -- App owners can manage their app's roles
   CREATE POLICY app_owner_manage_roles ON user_app_role
     USING (EXISTS (
       SELECT 1 FROM user_app_role 
       WHERE user_id = auth.uid() 
       AND app_id = user_app_role.app_id 
       AND role = 'app_owner'
     ));
     
   -- Users can view their own app roles
   CREATE POLICY view_own_app_roles ON user_app_role
     FOR SELECT
     USING (user_id = auth.uid());
   ```

### Step 2: App Management UI

1. Create app listing interface for platform admins
2. Build app creation and editing forms
3. Implement app role assignment UI
4. Add app metrics dashboard

### Step 3: App-Specific Features

1. Configure app settings management
2. Implement app status controls
3. Add app usage analytics

## Phase 3: Organization Management

**Goal:** Implement organization management with proper RLS policies.

### Step 1: Organization Database Schema

1. **Organization Table**
   ```sql
   CREATE TABLE organization (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     app_id UUID REFERENCES app(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
   
   -- Platform admins can view all organizations
   CREATE POLICY platform_admin_org_policy ON organization
     FOR SELECT
     USING (EXISTS (
       SELECT 1 FROM user_platform_role 
       WHERE user_id = auth.uid() 
       AND role IN ('platform_owner', 'platform_admin')
     ));
   
   -- App owners/admins can manage organizations in their app
   CREATE POLICY app_admin_org_policy ON organization
     USING (EXISTS (
       SELECT 1 FROM user_app_role 
       WHERE user_id = auth.uid() 
       AND app_id = organization.app_id 
       AND role IN ('app_owner', 'app_admin')
     ));
   
   -- Organization members can view their organizations
   CREATE POLICY org_member_view_policy ON organization
     FOR SELECT
     USING (EXISTS (
       SELECT 1 FROM user_organization_role 
       WHERE user_id = auth.uid() 
       AND organization_id = organization.id
     ));
   ```

2. **User-Organization Relationship Table**
   ```sql
   CREATE TABLE user_organization_role (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('org_owner', 'org_admin', 'member')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, organization_id, role)
   );
   
   -- Enable RLS
   ALTER TABLE user_organization_role ENABLE ROW LEVEL SECURITY;
   
   -- Platform admins can manage all organization roles
   CREATE POLICY platform_admin_org_role_policy ON user_organization_role
     USING (EXISTS (
       SELECT 1 FROM user_platform_role 
       WHERE user_id = auth.uid() 
       AND role IN ('platform_owner', 'platform_admin')
     ));
   
   -- App owners/admins can manage organizations in their app
   CREATE POLICY app_admin_org_role_policy ON user_organization_role
     USING (EXISTS (
       SELECT 1 FROM user_app_role ur
       JOIN organization o ON o.app_id = ur.app_id
       WHERE ur.user_id = auth.uid() 
       AND o.id = user_organization_role.organization_id
       AND ur.role IN ('app_owner', 'app_admin')
     ));
   
   -- Org owners/admins can manage members in their organization
   CREATE POLICY org_admin_role_policy ON user_organization_role
     USING (EXISTS (
       SELECT 1 FROM user_organization_role 
       WHERE user_id = auth.uid() 
       AND organization_id = user_organization_role.organization_id 
       AND role IN ('org_owner', 'org_admin')
     ));
     
   -- Users can view their own organization roles
   CREATE POLICY view_own_org_roles ON user_organization_role
     FOR SELECT
     USING (user_id = auth.uid());
   ```

### Step 2: Organization Management UI

1. Create organization listing for app admins
2. Build organization management interface
3. Implement organization member management
4. Add organization analytics dashboard

### Step 3: Organization-Specific Features

1. Configure organization settings management
2. Implement organization status controls
3. Add member invitation system

## Authentication Integration

1. **JWT Claims for Authorization**
   - Include user ID in JWT
   - Use Supabase for authentication
   - Add server middleware to verify JWT

2. **Roles and Claims Propagation**
   - Create API endpoint to fetch user roles
   - Cache roles in client-side state
   - Use roles for UI authorization

## Testing Strategy

For each phase:
1. **Database Tests**: Verify RLS policies work correctly
2. **API Tests**: Ensure endpoints respect authorization rules
3. **UI Tests**: Confirm interfaces show/hide based on permissions
4. **Integration Tests**: Test the entire authentication/authorization flow

## Next Phases (Future)

After implementing the core platform -> app -> organization structure:

1. **Credential Management**: Add credential tables with appropriate RLS
2. **Document Store Management**: Implement document store authorization
3. **Project/Workspace Structure**: Add project and workspace tables with RLS

## Migration and Deployment Strategy

1. **Database Migrations**:
   - Create scripts for each phase
   - Include RLS policy definitions
   - Test migrations in staging environment

2. **Rollback Plan**:
   - Create rollback scripts
   - Test rollback procedures
   - Document rollback process

## Success Metrics

- Clear visibility into authorization rules
- Simplified debugging of permission issues
- Reduced authorization complexity
- Improved development experience 

## Files Implemented/Modified

### Authentication Backend
- `packages/server/src/routes/auth/login.ts` - Email/password authentication endpoint
- `packages/server/src/routes/auth/magic-link.ts` - Passwordless authentication
- `packages/server/src/routes/auth/callback.ts` - OAuth callback handling
- `packages/server/src/routes/auth/logout.ts` - User logout functionality
- `packages/server/src/routes/auth/users.ts` - User management endpoints
- `packages/server/src/routes/auth/supabase-token.ts` - JWT token generation
- `packages/server/src/utils/supabaseAuth.ts` - Authentication middleware
- `packages/server/src/utils/supabase.ts` - Supabase client configuration
- `packages/server/src/routes/index.ts` - API routes registration

### Frontend Components
- `packages/ui/src/views/auth/Login.jsx` - Login form and authentication UI
- `packages/ui/src/contexts/AuthContext.jsx` - Authentication state management
- `packages/ui/src/routes/ProtectedRoute.jsx` - Route protection based on auth state
- `packages/ui/src/api/client.js` - API client with auth token handling
- `packages/ui/src/App.jsx` - Main application with auth provider
- `packages/ui/src/utils/ImageUtils.js` - Authenticated image loading utilities
- `packages/ui/src/ui-component/image/AuthImage.jsx` - Component for loading authenticated images
- `packages/ui/src/ui-component/cards/ItemCard.jsx` - Updated to use AuthImage for secure image loading

### Documentation
- `doc/multi/implementation_plan.md` - Implementation strategy document
- `doc/multi/org_structure.md` - Organizational structure documentation
- `API_TESTING.md` - Guide for testing the Supabase Auth API endpoints 

## Authentication Improvements

**Goal:** Fix authentication issues with token expiration and implement token refresh mechanism.

### Problem Addressed

Users were experiencing frequent logouts and were being redirected to the login page on page refresh due to:
1. Short-lived tokens (1 hour expiration)
2. No token refresh mechanism
3. No persistence of authentication state across page refreshes

### Solution Implemented

#### Step 1: Extended Token Lifetime

1. **Modified Token Expiration**
   ```javascript
   // packages/server/src/routes/auth/supabase-token.ts
   const jwt = await new jose.SignJWT({ 
     sub: user.userId,
     role: 'authenticated',
   })
     .setProtectedHeader({ alg: 'HS256' })
     .setIssuedAt()
     .setExpirationTime('7d')  // Changed from '1h' to '7d'
     .sign(secret);
   ```

#### Step 2: Added Token Refresh Mechanism

1. **Created Refresh Token Endpoint**
   ```javascript
   // packages/server/src/routes/auth/refresh-token.ts
   import express from 'express';
   import { supabase } from '../../utils/supabase';

   const router = express.Router();

   router.post('/', async (req, res) => {
     try {
       const { refresh_token } = req.body;
       
       if (!refresh_token) {
         return res.status(400).json({ error: 'Refresh token is required' });
       }
       
       // Exchange refresh token for a new session
       const { data, error } = await supabase.auth.refreshSession({
         refresh_token
       });
       
       if (error) {
         console.error('Token refresh error:', error);
         return res.status(401).json({ error: error.message });
       }
       
       if (!data.session) {
         return res.status(401).json({ error: 'Invalid refresh token' });
       }
       
       return res.json({
         session: {
           access_token: data.session.access_token,
           refresh_token: data.session.refresh_token,
           expires_at: data.session.expires_at
         }
       });
     } catch (error) {
       console.error('Error refreshing token:', error);
       return res.status(500).json({ error: 'Failed to refresh token' });
     }
   });

   export default router;
   ```

2. **Updated Auth Response Schema**
   - Modified login response to include the refresh token 
   ```javascript
   // packages/server/src/routes/auth/login.ts
   return res.json({
     user,
     session: {
       access_token: data.session.access_token,
       refresh_token: data.session.refresh_token,  // Added refresh token
       expires_at: data.session.expires_at
     }
   });
   ```

   - Modified callback exchange response to include the refresh token
   ```javascript
   // packages/server/src/routes/auth/callback.ts
   return res.json({
     user,
     session: {
       access_token: data.session.access_token,
       refresh_token: data.session.refresh_token,  // Added refresh token
       expires_at: data.session.expires_at
     }
   });
   ```

3. **Registered the Refresh Token Route**
   ```javascript
   // packages/server/src/routes/index.ts
   import refreshTokenRouter from './auth/refresh-token';
   // ...
   router.use('/auth/refresh-token', refreshTokenRouter);
   ```

#### Step 3: Enhanced Client-Side Authentication

1. **Updated API Client with Token Refresh Logic**
   ```javascript
   // packages/ui/src/api/client.js
   // Added refresh token functionality to the API client
   
   // Flag to prevent multiple refresh token requests
   let isRefreshing = false;
   // Queue of requests to retry after token refresh
   let refreshSubscribers = [];

   // Function to process queue of failed requests
   const processQueue = (error, token = null) => {
     refreshSubscribers.forEach(callback => {
       if (error) {
         callback(error);
       } else {
         callback(token);
       }
     });
     refreshSubscribers = [];
   };

   // Function to refresh the token
   const refreshToken = async () => {
     try {
       const refreshToken = localStorage.getItem('refresh_token');
       if (!refreshToken) {
         throw new Error('No refresh token available');
       }
       
       const response = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, {
         refresh_token: refreshToken
       });
       
       const { access_token, refresh_token, expires_at } = response.data;
       
       // Update tokens in local storage
       localStorage.setItem('access_token', access_token);
       localStorage.setItem('refresh_token', refresh_token);
       localStorage.setItem('token_expiry', expires_at.toString());
       
       return access_token;
     } catch (error) {
       // Clear auth data and redirect to login
       localStorage.removeItem('access_token');
       localStorage.removeItem('refresh_token');
       localStorage.removeItem('token_expiry');
       localStorage.removeItem('user');
       
       window.location.href = '/login';
       throw error;
     }
   };

   // Response interceptor to handle token expiration
   apiClient.interceptors.response.use(
     response => response,
     async error => {
       const originalRequest = error.config;
       
       // If unauthorized error (401) and not already retrying
       if (error.response?.status === 401 && !originalRequest._retry) {
         if (isRefreshing) {
           // Add request to queue to retry later
           return new Promise((resolve, reject) => {
             refreshSubscribers.push(token => {
               originalRequest.headers.Authorization = `Bearer ${token}`;
               resolve(axios(originalRequest));
             });
           });
         }
         
         originalRequest._retry = true;
         isRefreshing = true;
         
         try {
           const newToken = await refreshToken();
           processQueue(null, newToken);
           originalRequest.headers.Authorization = `Bearer ${newToken}`;
           return axios(originalRequest);
         } catch (refreshError) {
           processQueue(refreshError, null);
           return Promise.reject(refreshError);
         } finally {
           isRefreshing = false;
         }
       }
       
       return Promise.reject(error);
     }
   );
   ```

2. **Enhanced Auth Context with Refresh Token Handling**
   ```javascript
   // packages/ui/src/contexts/AuthContext.jsx
   
   // Modified token expiration handling to attempt refresh
   if (isTokenValid) {
     setUser(JSON.parse(storedUser));
     setIsAuthenticated(true);
   } else {
     // Token expired, try to refresh it if we have a refresh token
     const refreshToken = localStorage.getItem('refresh_token');
     if (refreshToken) {
       // We'll let the API client handle the token refresh
       // This will happen automatically on the next API call
     } else {
       // No refresh token, clear storage
       localStorage.removeItem('user');
       localStorage.removeItem('access_token');
       localStorage.removeItem('token_expiry');
     }
   }
   
   // Updated login function to store refresh token
   const login = (userData) => {
     // ... existing code ...
     
     // Store refresh token if available
     if (userData.refreshToken) {
       localStorage.setItem('refresh_token', userData.refreshToken);
     }
     
     // ... existing code ...
   };
   
   // Updated logout function to remove refresh token
   const logout = async () => {
     // ... existing code ...
     localStorage.removeItem('refresh_token');
     // ... existing code ...
   };
   ```

3. **Updated Login Component**
   ```javascript
   // packages/ui/src/views/auth/Login.jsx
   
   // Added refresh token handling to login process
   login({
     email: data.user.email,
     accessToken: data.session.access_token,
     refreshToken: data.session.refresh_token,
     expiresAt: data.session.expires_at,
     userId: data.user.userId,
     provider: data.user.provider,
     userMetadata: data.user.userMetadata
   });
   ```

### Results

The implemented solution resolves the authentication issues by:

1. **Extending token lifetime** from 1 hour to 7 days, significantly reducing the frequency of required refreshes
2. **Adding automatic token refresh** when tokens expire, preventing unwanted logouts
3. **Maintaining session state** across page refreshes
4. **Handling multiple concurrent requests** during token refresh, avoiding race conditions
5. **Gracefully handling refresh failures** by redirecting to login only when absolutely necessary

This approach ensures a seamless user experience while maintaining proper security protocols. 