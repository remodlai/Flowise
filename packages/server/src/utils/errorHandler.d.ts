import { Response } from 'express';
/**
 * Handle API errors and return appropriate response
 * @param res Express Response object
 * @param error Error object
 * @param defaultMessage Default error message
 * @returns Response with error details
 */
export declare const handleError: (res: Response, error: any, defaultMessage: string) => Response;
