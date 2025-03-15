/**
 * Permissions Utility
 * 
 * Handles JWT decoding and permission checks based on user roles.
 */

import { jwtDecode } from 'jwt-decode';

/**
 * JWT Claims interface
 */
export interface JWTClaims {
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  user_role?: string;
  [key: string]: any;
}

/**
 * Decode JWT token and extract claims
 * 
 * @param token - JWT token to decode
 * @returns Decoded JWT claims
 */
export const decodeJWT = (token: string): JWTClaims => {
  try {
    return jwtDecode<JWTClaims>(token);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return {} as JWTClaims;
  }
};

/**
 * Check if user has a specific role
 * 
 * @param token - JWT token
 * @param role - Role to check
 * @returns True if user has the role
 */
export const hasRole = (token: string, role: string): boolean => {
  const claims = decodeJWT(token);
  return claims.user_role === role;
};

/**
 * Permission check function
 * 
 * @param token - JWT token
 * @param permission - Permission to check
 * @param rolePermissions - Map of roles to permissions
 * @returns True if user has the permission
 */
export const hasPermission = (
  token: string, 
  permission: string,
  rolePermissions: Record<string, string[]>
): boolean => {
  const claims = decodeJWT(token);
  const userRole = claims.user_role;
  
  if (!userRole || !rolePermissions[userRole]) {
    return false;
  }
  
  return rolePermissions[userRole].includes(permission);
}; 