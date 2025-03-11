import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to check if user has platform admin permissions
 * Simply checks the JWT claim instead of making a database call
 * @param requiredPermissions Array of permissions required to access the route (not used, kept for backward compatibility)
 */
export declare const checkAuthorization: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
