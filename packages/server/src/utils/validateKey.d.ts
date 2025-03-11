import { Request } from 'express';
import { ChatFlow } from '../database/entities/ChatFlow';
/**
 * Check if a token is likely a JWT token
 * @param {string} token
 * @returns {boolean}
 */
export declare const isLikelyJWT: (token: string) => boolean;
/**
 * Validate Chatflow API Key
 * @param {Request} req
 * @param {ChatFlow} chatflow
 */
export declare const validateChatflowAPIKey: (req: Request, chatflow: ChatFlow) => Promise<boolean>;
/**
 * Validate API Key
 * @param {Request} req
 */
export declare const validateAPIKey: (req: Request) => Promise<boolean>;
