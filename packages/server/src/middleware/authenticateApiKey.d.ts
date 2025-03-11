import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to authenticate API keys
 * This should be used before the Supabase authentication middleware
 */
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
