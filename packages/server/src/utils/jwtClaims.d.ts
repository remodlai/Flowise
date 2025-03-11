/**
 * JWT Claims Utility Functions
 *
 * This file contains utility functions for working with JWT claims,
 * specifically for extracting user ID and organization ID.
 */
import { Request } from 'express';
/**
 * Interface for the user context extracted from JWT claims
 */
export interface IUserContext {
    userId: string;
    orgId: string | null;
    isPlatformAdmin: boolean;
}
/**
 * Extract user context (userId and orgId) from JWT claims in the request
 *
 * @param req - Express request object containing the JWT token
 * @returns Object containing userId and orgId
 */
export declare const extractUserContextFromJWT: (req: Request) => IUserContext;
/**
 * Extract user context from the request object
 * This function first tries to get the context from req.user,
 * and falls back to extracting it from the JWT if not available
 *
 * @param req - Express request object
 * @returns Object containing userId and orgId
 */
export declare const getUserContext: (req: Request) => IUserContext;
