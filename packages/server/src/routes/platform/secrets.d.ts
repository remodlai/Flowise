import { Request, Response } from 'express';
/**
 * Get all secrets
 * @param req Request
 * @param res Response
 */
export declare const getAllSecrets: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get a secret by ID
 * @param req Request
 * @param res Response
 */
export declare const getSecretById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Create a new secret
 * @param req Request
 * @param res Response
 */
export declare const createSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update a secret
 * @param req Request
 * @param res Response
 */
export declare const updateSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete a secret
 * @param req Request
 * @param res Response
 */
export declare const deleteSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getAllSecrets: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getSecretById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteSecret: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
