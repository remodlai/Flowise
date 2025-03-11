import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to log JWT claims for debugging
 */
export declare const jwtDebugMiddleware: (req: Request, res: Response, next: NextFunction) => void;
