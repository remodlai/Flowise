import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            applicationId?: string;
        }
    }
}
/**
 * Get the current application ID from the request
 * @param req The Express request object
 * @returns The current application ID or null
 */
export declare const getCurrentApplicationId: (req?: Request) => string | null;
/**
 * Middleware to set the current application context
 * @param req The Express request object
 * @param res The Express response object
 * @param next The next middleware function
 */
export declare const applicationContextMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
