/**
 * Remodl AI Auth
 * 
 * This is the main authentication class for Remodl AI applications.
 * It wraps Supabase Auth functionality and provides a consistent interface.
 * 
 * CURRENT IMPLEMENTATION:
 * - Authentication functionality with PKCE flow
 * - Session management
 * - Token storage
 * 
 * FUTURE ENHANCEMENTS:
 * - MFA support
 * - Role-based access control
 * - API key authentication
 * 
 * @see /docs/implementation_plan.md
 */

import { createRemodlAIAuthClient, RemodlAIAuthClient } from '../utils/remodlAiClient';
import { TokenStorage, StorageType } from './TokenStorage';
import config from '../../config.json';
import {
  AuthOptions,
  AuthResponse,
  Session,
  User,
  SessionResponse,
  UserResponse,
  UserAttributes,
  ResetPasswordResponse,
  UpdatePasswordResponse,
  MFAResponse
} from '../types';
import { jwtDecode } from 'jwt-decode';
/**
 * Main authentication class for Remodl AI
 */
export class RemodlAuth {
  private client: RemodlAIAuthClient;
  private tokenStorage: TokenStorage;
  private options: AuthOptions;

  /**
   * Constructor
   * 
   * @param options - Authentication options
   */
  constructor(options: AuthOptions) {
    this.options = {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...options
    };

    // Initialize token storage
    this.tokenStorage = new TokenStorage(options.storage);

    // Determine storage for Supabase client
    // Check if window exists for non-browser environments
    const storageOption = options.storage === 'memory' 
      ? undefined 
      : typeof window !== 'undefined' ? window.localStorage : undefined;

    // Initialize Supabase client
    this.client = createRemodlAIAuthClient(options.remodlPlatformDataUrl, options.remodlPlatformDataAnonKey, {
      auth: {
        autoRefreshToken: options.autoRefreshToken,
        persistSession: options.persistSession,
        flowType: 'pkce',
        detectSessionInUrl: this.options.detectSessionInUrl,
        storage: storageOption
      }
    });

    // Set up session refresh if enabled
    if (options.autoRefreshToken) {
      this.setupSessionRefresh();
    }

    // Debug logging
    if (options.debug) {
      console.log('RemodlAuth initialized with options:', options);
    }
  }

  /**
   * Sign in with email and password
   * 
   * @param email - User's email
   * @param password - User's password
   * @returns Authentication response
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { session: null, user: null, error };
      }

      // Store session data
      if (data.session) {
        this.storeSession(data.session);
      }

      return {
        session: data.session ? this.mapSession(data.session) : null,
        user: data.user ? this.mapUser(data.user) : null,
        error: null
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: error instanceof Error ? error : new Error('Unknown error during sign in')
      };
    }
  }

  /**
   * Sign in with email link
   * 
   * @param email - User's email
   * @param options - Sign in options
   * @returns Authentication response
   */
  async signInWithEmailMagicLink(email: string) {
    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${config.remodlApplicationMagicLinkRedirectUrl}`,
        shouldCreateUser: false
      }
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  }

  /**
   * @deprecated Use signupForAppWithEmailPassword instead. This method does not properly implement the PKCE flow or handle application-specific signup.
   * Sign up with email and password
   * 
   * @param email - User's email
   * @param password - User's password
   * @param userData - Optional additional user data
   * @returns Authentication response
   */
  async signUp(email: string, password: string, userData?: Record<string, any>): Promise<AuthResponse> {
    console.warn('This method is deprecated. Please use signupForAppWithEmailPassword instead.');
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            appId: config.remodlApplicationId ? config.remodlApplicationId : null,
            ...userData
          }
        }
      });

      if (error) {
        return { session: null, user: null, error };
      }

      // Store session data if available (might not be for email confirmation flows)
      if (data.session) {
        this.storeSession(data.session);
      }

      return {
        session: data.session ? this.mapSession(data.session) : null,
        user: data.user ? this.mapUser(data.user) : null,
        error: null
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: error instanceof Error ? error : new Error('Unknown error during sign up')
      };
    }
  }

  /**
   * Sign up a user for a specific Remodl AI application using email and password
   * 
   * This method implements the proper PKCE flow through the Remodl Platform API:
   * 1. Creates the user account
   * 2. Sends confirmation email
   * 3. When user confirms email, they are redirected to auth/confirm endpoint
   * 4. auth/confirm handles PKCE token exchange
   * 5. User is redirected to redirectTarget with tokens in query params
   * 
   * The signup process includes:
   * - User account creation in the specified application
   * - Email verification
   * - Setting initial user metadata (isOnboarded: false)
   * - PKCE flow implementation for secure token exchange
   * 
   * @param applicationId - The ID of the Remodl AI application
   * @param email - User's email address
   * @param password - User's password (min 8 characters)
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @param redirectTarget - URL to redirect to after email confirmation
   * @returns Promise<AuthResponse>
   */
  async signupForAppWithEmailPassword(
    applicationId: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    redirectTarget: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${config.remodlPlatformApiUrl}/applications/${applicationId}/users/signup/email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            redirectTarget
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          session: null,
          user: null,
          error: new Error(error.message || 'Failed to sign up user')
        };
      }

      // At this point, the user is created but not confirmed
      // They will receive an email with a confirmation link
      // When they click it, they'll be redirected to auth/confirm
      // which will handle the PKCE flow and redirect to redirectTarget
      // with tokens in query params
        
      return {
        session: null, // No session yet until email confirmation
        user: null,   // No user details yet until email confirmation
        error: null
      };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: error instanceof Error ? error : new Error('Unknown error during sign up')
      };
    }
  }

  /**
   * Sign out the current user
   * 
   * @returns Promise that resolves when sign out is complete
   */
  async signOut(): Promise<void> {
    await this.client.auth.signOut();
    this.tokenStorage.clear();
  }

  /**
   * Get the current session
   * 
   * @returns Session response
   */
  async getSession(): Promise<SessionResponse> {
    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) {
        return { session: null, error };
      }

      return {
        session: data.session ? this.mapSession(data.session) : null,
        error: null
      };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error getting session')
      };
    }
  }

  /**
   * Refresh the current session
   * 
   * @returns Session response
   */
  async refreshSession(): Promise<SessionResponse> {
    try {
      const { data, error } = await this.client.auth.refreshSession();

      if (error) {
        return { session: null, error };
      }

      // Store refreshed session data
      if (data.session) {
        this.storeSession(data.session);
      }

      return {
        session: data.session ? this.mapSession(data.session) : null,
        error: null
      };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error refreshing session')
      };
    }
  }

  /**
   * Get the current user
   * 
   * @returns User response
   */
  async getUser(): Promise<UserResponse> {
    try {
      const { data, error } = await this.client.auth.getUser();

      if (error) {
        return { user: null, error };
      }

      return {
        user: data.user ? this.mapUser(data.user) : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Unknown error getting user')
      };
    }
  }

  /**
   * Update the current user
   * 
   * @param attributes - User attributes to update
   * @returns User response
   */
  async updateUser(attributes: UserAttributes): Promise<UserResponse> {
    try {
      const { data, error } = await this.client.auth.updateUser(attributes);

      if (error) {
        return { user: null, error };
      }

      return {
        user: data.user ? this.mapUser(data.user) : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Unknown error updating user')
      };
    }
  }

  /**
   * Reset password for a user
   * 
   * @param email - User's email
   * @returns Reset password response
   */
  async resetPassword(email: string): Promise<ResetPasswordResponse> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error resetting password')
      };
    }
  }

  /**
   * Update password for the current user
   * 
   * @param password - New password
   * @returns Update password response
   */
  async updatePassword(password: string): Promise<UpdatePasswordResponse> {
    try {
      const { error } = await this.client.auth.updateUser({ password });

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error updating password')
      };
    }
  }

  /**
   * Check if the user is authenticated
   * 
   * @returns True if the user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = this.tokenStorage.getItem('access_token');
    return !!accessToken;
  }

  /**
   * Exchange code for session in PKCE flow
   * 
   * @param code - The code from the URL after redirect
   * @returns Session response
   */
  async exchangeCodeForSession(code: string): Promise<SessionResponse> {
    try {
      const { data, error } = await this.client.auth.exchangeCodeForSession(code);

      if (error) {
        return { session: null, error };
      }

      // Store session data
      if (data.session) {
        this.storeSession(data.session);
      }

      return {
        session: data.session ? this.mapSession(data.session) : null,
        error: null
      };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error exchanging code for session')
      };
    }
  }

  /**
   * Get the JWT claims from the access token
   * 
   * @returns The JWT claims or null if not authenticated
   */
  getJwtClaims(): any {
    const accessToken = this.tokenStorage.getItem('access_token');
    if (!accessToken) return null;
    
    try {
      return jwtDecode(accessToken);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Check if the user is a platform admin
   * 
   * @returns True if the user is a platform admin
   */
  isPlatformAdmin(): boolean {
    const claims = this.getJwtClaims();
    return claims?.is_platform_admin === true;
  }

  /**
   * Check if the user has a specific role
   * 
   * @param role - Role to check
   * @returns True if the user has the role
   */
  hasRole(role: string): boolean {
    const claims = this.getJwtClaims();
    if (!claims?.user_roles) return false;
    
    return claims.user_roles.some((r: any) => r.role === role);
  }

  /**
   * Check if the user has a specific permission
   * 
   * @param permission - Permission to check
   * @returns True if the user has the permission
   */
  hasPermission(permission: string): boolean {
    // Platform admins have all permissions
    if (this.isPlatformAdmin()) return true;
    
    // For regular permission checks, we would need to maintain a client-side
    // mapping of roles to permissions, or make a server call
    // This is a placeholder that will need to be implemented based on your specific needs
    console.warn('Client-side permission checking requires a server call or role-permission mapping');
    return false;
  }

  /**
   * Check if the user has permission for a specific resource
   * 
   * @param permission - Permission to check
   * @param resourceType - Type of resource
   * @param resourceId - ID of resource
   * @returns True if the user has the permission for the resource
   */
  hasResourcePermission(permission: string, resourceType: string, resourceId: string): boolean {
    // Platform admins have all permissions
    if (this.isPlatformAdmin()) return true;
    
    const claims = this.getJwtClaims();
    if (!claims?.user_roles) return false;
    
    // Check if any of the user's roles has the requested permission for the specific resource
    return claims.user_roles.some((r: any) => 
      r.role === permission && 
      (
        // Match if the role is for this specific resource
        (r.resource_type === resourceType && r.resource_id === resourceId) ||
        // Or if the role is global (null resource_type and resource_id)
        (r.resource_type === null && r.resource_id === null)
      )
    );
  }

  /**
   * Get the underlying Supabase client
   * 
   * @returns Supabase client
   */
  getRemodlAiClient(): RemodlAIAuthClient {
    return this.client;
  }

  /**
   * Get the current access token
   * 
   * @returns The current access token or null if not authenticated
   */
  getAccessToken(): string | null {
    return this.tokenStorage.getItem('access_token');
  }

  /**
   * Get the complete decoded JWT with all claims
   * 
   * @returns The complete decoded JWT object or null if not authenticated
   * @throws Error if token is invalid or decoding fails
   */
  getDecodedJwt(): any | null {
    const accessToken = this.tokenStorage.getItem('access_token');
    if (!accessToken) return null;
    
    try {
      const decoded = jwtDecode(accessToken);
      return {
        ...decoded,
        raw: accessToken // Include the raw token for convenience
      };
    } catch (error) {
      throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up automatic session refresh
   * 
   * @private
   */
  private setupSessionRefresh(): void {
    // Listen for auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          this.storeSession(session);
        }
      } else if (event === 'SIGNED_OUT') {
        this.tokenStorage.clear();
      }
    });
  }

  /**
   * Store session data in token storage
   * 
   * @param session - Session to store
   * @private
   */
  private storeSession(session: any): void {
    const expiresAt = session.expires_at ? session.expires_at * 1000 : undefined;
    
    this.tokenStorage.setItem('access_token', session.access_token, expiresAt);
    
    if (session.refresh_token) {
      // Refresh tokens typically have a longer expiry
      const refreshExpiresAt = expiresAt ? expiresAt + (30 * 24 * 60 * 60 * 1000) : undefined; // Add 30 days
      this.tokenStorage.setItem('refresh_token', session.refresh_token, refreshExpiresAt);
    }
    
    if (session.user) {
      this.tokenStorage.setItem('user', JSON.stringify(session.user));
    }
  }

  /**
   * Map Supabase session to our Session type
   * 
   * @param session - Supabase session
   * @returns Mapped session
   * @private
   */
  private mapSession(session: any): Session {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: this.mapUser(session.user),
      expiresAt: session.expires_at ? session.expires_at * 1000 : undefined
    };
  }

  /**
   * Map Supabase user to our User type
   * 
   * @param user - Supabase user
   * @returns Mapped user
   * @private
   */
  private mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at ? true : false,
      phone: user.phone,
      lastSignInAt: user.last_sign_in_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      userMetadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {}
    };
  }

  /**
   * Make an authenticated API request
   * 
   * Handles:
   * - Token retrieval
   * - Token expiration check
   * - Automatic token refresh
   * - Authorization header
   * 
   * @param url - The API endpoint URL
   * @param options - Fetch options (method, body, etc.)
   * @returns Promise with the fetch response
   */
  async authenticatedRequest(
      url: string,
      options: RequestInit = {}
  ): Promise<Response> {
      try {
          // Get current token and check expiration
          let token = this.getAccessToken();
          if (token) {
              const claims = this.getJwtClaims();
              // Check if token is expired or close to expiry (within 1 minute)
              if (claims.exp && claims.exp * 1000 - Date.now() < 60000) {
                  // Token is expired or about to expire, try to refresh
                  const { session, error } = await this.refreshSession();
                  if (error) throw error;
                  token = session?.accessToken || null;
              }
          }

          if (!token) {
              throw new Error('No valid authentication token available');
          }

          // Merge headers with existing options
          const headers = {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              ...(options.headers || {})
          };

          // Make the authenticated request
          const response = await fetch(url, {
              ...options,
              headers
          });

          // Handle 401 (Unauthorized) - token might have just expired
          if (response.status === 401) {
              // Try to refresh token
              const { session, error } = await this.refreshSession();
              if (error) throw error;
              
              // Retry request with new token
              return fetch(url, {
                  ...options,
                  headers: {
                      ...headers,
                      'Authorization': `Bearer ${session?.accessToken}`
                  }
              });
          }

          return response;
      } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to make authenticated request');
      }
  }
} 

