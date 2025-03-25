# Remodl AI Auth Package Refactoring Plan

## Overview

This document outlines the refactoring plan for the Remodl AI Auth package to implement proper Supabase Auth PKCE flow and provide a portable, white-labeled authentication client that can be used across different front-end applications. The refactored package will also include integration with the Zuplo API gateway.

## Current State

The current implementation of the Remodl AI Auth package:

1. Uses a custom authentication implementation instead of properly leveraging Supabase Auth's built-in features
2. Implements a manual token refresh mechanism
3. Does not properly support PKCE flow as recommended by Supabase
4. Has custom JWT decoding and claims extraction
5. Is tightly coupled with the current UI implementation

## Goals

1. Implement proper Supabase Auth PKCE flow
2. Create a portable, white-labeled authentication client
3. Support integration with Zuplo API gateway
4. Improve error handling and type safety
5. Provide comprehensive documentation and examples
6. Support multiple storage options (localStorage, sessionStorage, memory, custom)
7. Maintain backward compatibility where possible

## Implementation Plan

### Phase 1: Core Refactoring

#### 1.1 Update AuthOptions Interface

```typescript
export interface AuthOptions {
  // Supabase configuration
  supabaseUrl: string;
  supabaseKey: string;
  
  // Flow configuration
  flowType?: 'pkce' | 'implicit'; // Default to 'pkce'
  detectSessionInUrl?: boolean;   // Default to true for PKCE flow
  
  // Storage configuration
  storage?: 'localStorage' | 'sessionStorage' | 'memory' | CustomStorageAdapter;
  
  // Session configuration
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  
  // Zuplo API gateway configuration
  zuploApiUrl?: string;
  
  // Branding configuration
  branding?: {
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
    };
    productName?: string;
  };
  
  // Redirect configuration
  redirectUrl?: string;
  
  // Debug mode
  debug?: boolean;
}

export interface CustomStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

#### 1.2 Refactor RemodlAuth Class

```typescript
export class RemodlAuth {
  private supabase: SupabaseClient;
  private options: AuthOptions;
  private storageAdapter: StorageAdapter;

  constructor(options: AuthOptions) {
    this.options = this.normalizeOptions(options);
    this.storageAdapter = this.createStorageAdapter(options.storage);
    
    // Initialize Supabase client with PKCE flow
    this.supabase = createClient(options.supabaseUrl, options.supabaseKey, {
      auth: {
        flowType: options.flowType || 'pkce',
        detectSessionInUrl: options.detectSessionInUrl !== false,
        autoRefreshToken: options.autoRefreshToken !== false,
        persistSession: options.persistSession !== false,
        storage: this.storageAdapter
      }
    });
  }
  
  // Authentication methods
  async signInWithPassword(email: string, password: string): Promise<AuthResponse> { /* ... */ }
  async signInWithOAuth(provider: Provider, options?: OAuthOptions): Promise<OAuthResponse> { /* ... */ }
  async signInWithMagicLink(email: string, options?: MagicLinkOptions): Promise<MagicLinkResponse> { /* ... */ }
  async signUp(email: string, password: string, metadata?: UserMetadata): Promise<AuthResponse> { /* ... */ }
  async signOut(): Promise<void> { /* ... */ }
  
  // Session management
  async getSession(): Promise<Session | null> { /* ... */ }
  async refreshSession(): Promise<Session | null> { /* ... */ }
  
  // PKCE flow handling
  async handleRedirect(): Promise<Session | null> { /* ... */ }
  async exchangeCodeForSession(code: string): Promise<Session | null> { /* ... */ }
  
  // User management
  async getUser(): Promise<User | null> { /* ... */ }
  async updateUser(attributes: UserAttributes): Promise<User | null> { /* ... */ }
  
  // Zuplo API integration
  getAuthHeaders(): Record<string, string> | null { /* ... */ }
  async fetchWithAuth(url: string, options?: RequestInit): Promise<Response> { /* ... */ }
  
  // Utility methods
  isAuthenticated(): boolean { /* ... */ }
  hasPermission(permission: string): boolean { /* ... */ }
  
  // Helper methods
  private normalizeOptions(options: AuthOptions): AuthOptions { /* ... */ }
  private createStorageAdapter(storage?: StorageType): StorageAdapter { /* ... */ }
}
```

#### 1.3 Implement Storage Adapters

```typescript
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null { /* ... */ }
  setItem(key: string, value: string): void { /* ... */ }
  removeItem(key: string): void { /* ... */ }
}

export class SessionStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null { /* ... */ }
  setItem(key: string, value: string): void { /* ... */ }
  removeItem(key: string): void { /* ... */ }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private storage: Record<string, string> = {};
  
  getItem(key: string): string | null { /* ... */ }
  setItem(key: string, value: string): void { /* ... */ }
  removeItem(key: string): void { /* ... */ }
}

export class CustomStorageAdapter implements StorageAdapter {
  constructor(private adapter: CustomStorageAdapterConfig) { /* ... */ }
  
  getItem(key: string): string | null { /* ... */ }
  setItem(key: string, value: string): void { /* ... */ }
  removeItem(key: string): void { /* ... */ }
}
```

### Phase 2: PKCE Flow Implementation

#### 2.1 Implement handleRedirect Method

```typescript
/**
 * Handle redirect after authentication
 * This method should be called on the redirect page after authentication
 * 
 * @returns The session if authentication was successful, otherwise null
 */
async handleRedirect(): Promise<Session | null> {
  // Check for code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) {
    return null;
  }
  
  try {
    // Exchange code for session
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      if (this.options.debug) {
        console.error('Error exchanging code for session:', error);
      }
      return null;
    }
    
    return this.mapSession(data.session);
  } catch (error) {
    if (this.options.debug) {
      console.error('Error handling redirect:', error);
    }
    return null;
  }
}
```

#### 2.2 Implement exchangeCodeForSession Method

```typescript
/**
 * Exchange code for session
 * 
 * @param code - The authorization code from the URL
 * @returns The session if exchange was successful, otherwise null
 */
async exchangeCodeForSession(code: string): Promise<Session | null> {
  try {
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      if (this.options.debug) {
        console.error('Error exchanging code for session:', error);
      }
      return null;
    }
    
    return this.mapSession(data.session);
  } catch (error) {
    if (this.options.debug) {
      console.error('Error exchanging code for session:', error);
    }
    return null;
  }
}
```

#### 2.3 Update signInWithOAuth Method

```typescript
/**
 * Sign in with OAuth provider
 * 
 * @param provider - OAuth provider (e.g., 'google', 'github')
 * @param options - OAuth options
 * @returns OAuth response
 */
async signInWithOAuth(provider: Provider, options?: OAuthOptions): Promise<OAuthResponse> {
  try {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo || this.options.redirectUrl,
        scopes: options?.scopes,
        queryParams: options?.queryParams
      }
    });
    
    if (error) {
      return { provider, url: null, error };
    }
    
    return {
      provider,
      url: data.url,
      error: null
    };
  } catch (error) {
    return {
      provider,
      url: null,
      error: error instanceof Error ? error : new Error('Unknown error during OAuth sign in')
    };
  }
}
```

### Phase 3: Zuplo API Integration

Zuplo provides built-in policies specifically designed to work with Supabase JWT tokens. This integration will leverage these built-in capabilities rather than implementing custom token validation and authorization logic.

#### 3.1 Implement getAuthHeaders Method

```typescript
/**
 * Get auth headers for API requests
 * 
 * The returned headers can be used with Zuplo's Supabase JWT Auth Inbound Policy
 * See: https://zuplo.com/docs/policies/supabase-jwt-auth-inbound
 * 
 * @returns Auth headers or null if not authenticated
 */
getAuthHeaders(): Record<string, string> | null {
  const session = this.getSessionData();
  
  if (!session || !session.access_token) {
    return null;
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`
  };
}
```

#### 3.2 Implement fetchWithAuth Method

```typescript
/**
 * Fetch with authentication
 * 
 * This method automatically adds the Authorization header with the current access token.
 * It works with Zuplo's Supabase JWT Auth Inbound Policy for authentication and authorization.
 * 
 * Note: This method relies on Zuplo to handle token validation and does not implement
 * custom token refresh logic. Token refresh is handled by the Supabase client automatically.
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 */
async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = this.getAuthHeaders();
  
  if (!headers) {
    throw new Error('Not authenticated');
  }
  
  // Combine headers
  const combinedHeaders = {
    ...options.headers,
    ...headers
  };
  
  // Create fetch options with auth headers
  const fetchOptions: RequestInit = {
    ...options,
    headers: combinedHeaders
  };
  
  // Let Zuplo handle authentication and authorization
  return fetch(url, fetchOptions);
}
```

#### 3.3 Add documentation for Zuplo integration

Create a comprehensive documentation guide explaining how to configure Zuplo to work with the Remodl AI Auth package, covering:

1. **Supabase JWT Auth Inbound Policy**: Authenticating users with Supabase JWT tokens in Zuplo

```json
{
  "name": "supabase-auth",
  "policyType": "supabase-jwt-auth-inbound",
  "handler": {
    "export": "SupabaseJwtInboundPolicy",
    "module": "$import(@zuplo/runtime)",
    "options": {
      "allowUnauthenticatedRequests": false,
      "secret": "$env(SUPABASE_JWT_SECRET)"
    }
  }
}
```

2. **JWT Scopes Inbound Policy**: Validating specific scopes or permissions in the JWT

```json
{
  "name": "require-admin-scope",
  "policyType": "jwt-scopes-inbound",
  "handler": {
    "export": "JWTScopeValidationInboundPolicy",
    "module": "$import(@zuplo/runtime)",
    "options": {
      "scopes": ["admin", "super-user"]
    }
  }
}
```

3. **RBAC Policy**: Implementing role-based access control using Zuplo

```json
{
  "name": "rbac-policy",
  "policyType": "rbac-policy-inbound",
  "handler": {
    "export": "default",
    "module": "$import(./modules/rbac-policy)",
    "options": {
      "allowedRoles": ["admin", "editor"]
    }
  }
}
```

4. **Route Configuration**: Setting up Zuplo routes with the appropriate policies

```json
{
  "path": "/api/users",
  "methods": ["GET"],
  "policies": [
    {
      "policyName": "supabase-auth"
    },
    {
      "policyName": "rbac-policy",
      "options": {
        "allowedRoles": ["admin"]
      }
    }
  ],
  "handler": {
    "export": "getUsersHandler",
    "module": "$import(./modules/users)"
  }
}
```

### Phase 4: React Hooks (Optional)

#### 4.1 Implement useRemodlAuth Hook

```typescript
export function useRemodlAuth(auth: RemodlAuth) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for current session
    const checkSession = async () => {
      const currentSession = await auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        const currentUser = await auth.getUser();
        setUser(currentUser);
      }
      
      setLoading(false);
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: authListener } = auth.getSupabaseClient().auth.onAuthStateChange(
      async (event, _session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const currentSession = await auth.getSession();
          setSession(currentSession);
          
          if (currentSession) {
            const currentUser = await auth.getUser();
            setUser(currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );
    
    // Cleanup subscription
    return () => {
      authListener?.unsubscribe();
    };
  }, [auth]);
  
  return {
    session,
    user,
    loading,
    signInWithPassword: auth.signInWithPassword.bind(auth),
    signInWithOAuth: auth.signInWithOAuth.bind(auth),
    signInWithMagicLink: auth.signInWithMagicLink.bind(auth),
    signUp: auth.signUp.bind(auth),
    signOut: auth.signOut.bind(auth),
    getSession: auth.getSession.bind(auth),
    refreshSession: auth.refreshSession.bind(auth),
    getUser: auth.getUser.bind(auth),
    updateUser: auth.updateUser.bind(auth),
    isAuthenticated: auth.isAuthenticated.bind(auth),
    hasPermission: auth.hasPermission.bind(auth)
  };
}
```

### Phase 5: Testing and Documentation

#### 5.1 Update Unit Tests

1. Test PKCE flow with mocked redirects
2. Test Zuplo API integration
3. Test various storage adapters
4. Test error handling scenarios

#### 5.2 Update Documentation

1. Update README.md with new features and usage examples
2. Update API documentation
3. Add PKCE flow explanation
4. Add Zuplo API integration guide
5. Add storage configuration guide
6. Update examples

#### 5.3 Create Examples

1. Basic usage example
2. PKCE flow example
3. React integration example
4. OAuth integration example
5. Zuplo API integration example

## Migration Path

To ensure a smooth transition for existing users of the Remodl AI Auth package, we will:

1. Maintain backward compatibility where possible
2. Provide clear migration guides
3. Create a migration utility function to help users migrate from the old API to the new one
4. Version the package appropriately (semver major version bump)

## Implementation Timeline

1. **Week 1**: Core refactoring and PKCE flow implementation
2. **Week 2**: Zuplo API integration and React hooks
3. **Week 3**: Testing and documentation
4. **Week 4**: Examples and migration path

## Conclusion

This refactoring plan outlines the steps needed to implement proper Supabase Auth PKCE flow in the Remodl AI Auth package and create a portable, white-labeled authentication client that can be used across different front-end applications. The refactored package will provide a more secure, flexible, and maintainable authentication solution for Remodl AI applications.

By following this plan, we will create a robust authentication solution that:

1. Follows Supabase Auth best practices
2. Implements proper PKCE flow for enhanced security
3. Integrates seamlessly with the Zuplo API gateway's built-in Supabase JWT Auth capabilities
4. Provides a consistent and portable authentication experience across different front-end applications
5. Is well-documented and easy to use 