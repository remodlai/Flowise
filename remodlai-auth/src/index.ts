/**
 * Remodl AI Auth Package
 * 
 * This is the main entry point for the Remodl AI Auth package.
 * It exports all the public APIs for authentication functionality.
 * 
 * CURRENT IMPLEMENTATION:
 * - Basic package structure
 * - ES module exports
 * 
 * FUTURE ENHANCEMENTS:
 * - Complete authentication functionality
 * - Token storage and management
 * - Session refreshing
 * - Support for Implicit and PKCE flows
 * 
 * @see /docs/implementation_plan.md
 */

// Re-export from core
export * from './core/RemodlAuth';
export * from './core/TokenStorage';

// Re-export from types
export * from './types';

// Version information
export const VERSION = '0.0.1'; 