/**
 * Type Definitions for Remodl AI Auth
 * 
 * This file contains all the TypeScript type definitions used throughout the package.
 * 
 * CURRENT IMPLEMENTATION:
 * - Basic type definitions for authentication
 * - PKCE flow authentication
 * 
 * FUTURE ENHANCEMENTS:
 * - Expanded types for all authentication flows
 * - More detailed session and user types
 * - API key and service user types
 * 
 * @see /docs/implementation_plan.md
 */

/**
 * Authentication options for initializing the RemodlAuth instance
 */
export interface AuthOptions {
  /**
   * The URL of the Remodl Data project
   */
  remodlPlatformDataUrl: string;
  
  /**
   * The public anon key of the Remodl Data project
   */
  remodlPlatformDataAnonKey: string;
  
  /**
   * Optional storage mechanism for tokens
   * Defaults to localStorage in browsers, memory storage in other environments
   */
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
  
  /**
   * Optional auto refresh token setting
   * Defaults to true
   */
  autoRefreshToken?: boolean;
  
  /**
   * Optional persistSession setting
   * Defaults to true
   */
  persistSession?: boolean;
  
  /**
   * Optional setting to automatically detect and exchange code for session in URL
   * Used for PKCE flow
   * Defaults to true
   */
  detectSessionInUrl?: boolean;
  
  /**
   * Optional debug mode
   * Defaults to false
   */
  debug?: boolean;
}

/**
 * Authentication response returned after sign in/sign up
 */
export interface AuthResponse {
  /**
   * The session data if authentication was successful
   */
  session: Session | null;
  
  /**
   * The user data if authentication was successful
   */
  user: User | null;
  
  /**
   * Any error that occurred during authentication
   */
  error: Error | null;
}

/**
 * Session data
 */
export interface Session {
  /**
   * The access token
   */
  accessToken: string;
  
  /**
   * The refresh token
   */
  refreshToken: string;
  
  /**
   * The user data
   */
  user: User;
  
  /**
   * The expiry time of the access token
   */
  expiresAt?: number;
}

/**
 * User data
 */
export interface User {
  /**
   * The user ID
   */
  id: string;
  
  /**
   * The user's email
   */
  email?: string;
  
  /**
   * Whether the user's email is confirmed
   */
  emailConfirmed?: boolean;
  
  /**
   * The user's phone
   */
  phone?: string;
  
  /**
   * The last time the user signed in
   */
  lastSignInAt?: string;
  
  /**
   * The time the user was created
   */
  createdAt?: string;
  
  /**
   * The time the user was last updated
   */
  updatedAt?: string;
  
  /**
   * Custom user metadata
   */
  userMetadata?: Record<string, any>;
  
  /**
   * App metadata
   */
  appMetadata?: Record<string, any>;
}

/**
 * Session response
 */
export interface SessionResponse {
  /**
   * The session data
   */
  session: Session | null;
  
  /**
   * Any error that occurred
   */
  error: Error | null;
}

/**
 * User response
 */
export interface UserResponse {
  /**
   * The user data
   */
  user: User | null;
  
  /**
   * Any error that occurred
   */
  error: Error | null;
}

/**
 * User attributes for updating
 */
export interface UserAttributes {
  /**
   * The user's email
   */
  email?: string;
  
  /**
   * The user's password
   */
  password?: string;
  
  /**
   * The user's phone
   */
  phone?: string;
  
  /**
   * Custom user metadata
   */
  userMetadata?: Record<string, any>;
}

/**
 * Reset password response
 */
export interface ResetPasswordResponse {
  /**
   * Whether the reset password email was sent
   */
  success: boolean;
  
  /**
   * Any error that occurred
   */
  error: Error | null;
}

/**
 * Update password response
 */
export interface UpdatePasswordResponse {
  /**
   * Whether the password was updated
   */
  success: boolean;
  
  /**
   * Any error that occurred
   */
  error: Error | null;
}

/**
 * MFA response
 */
export interface MFAResponse {
  /**
   * Whether the MFA operation was successful
   */
  success: boolean;
  
  /**
   * Any error that occurred
   */
  error: Error | null;
  
  /**
   * Additional data related to the MFA operation
   */
  data?: Record<string, any>;
} 