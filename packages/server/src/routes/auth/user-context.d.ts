import { Request, Response } from 'express';
/**
 * GET /api/v1/auth/user-context
 *
 * Returns the user context (userId and orgId) from JWT claims
 * This endpoint is useful for client applications that need to access
 * the user context without having to decode the JWT themselves
 */
export declare const getUserContextFromJWT: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
