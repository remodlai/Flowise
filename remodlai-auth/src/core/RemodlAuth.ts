/**
 * Remodl AI Auth
 * 
 * This is the main authentication class for Remodl AI applications.
 * It wraps Supabase Auth functionality and provides a consistent interface.
 * 
 * CURRENT IMPLEMENTATION:
 * - Basic authentication functionality
 * - Session management
 * - Token storage
 * 
 * FUTURE ENHANCEMENTS:
 * - Support for PKCE flow
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
      ...options
    };

    // Initialize token storage
    this.tokenStorage = new TokenStorage(options.storage);

    // Initialize Supabase client
    this.client = createRemodlAIAuthClient(options.remodlPlatformDataUrl, options.remodlPlatformDataAnonKey, {
      auth: {
        autoRefreshToken: options.autoRefreshToken,
        persistSession: options.persistSession,
        storage: options.storage === 'memory' ? undefined : window.localStorage
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
   * Sign up with email and password
   * 
   * @param email - User's email
   * @param password - User's password
   * @param userData - Optional additional user data
   * @returns Authentication response
   */
  async signUp(email: string, password: string, userData?: Record<string, any>): Promise<AuthResponse> {
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
} 

