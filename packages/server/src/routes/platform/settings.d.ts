import { Request, Response } from 'express';
/**
 * Get all platform settings
 * @param req Request
 * @param res Response
 */
export declare const getAllPlatformSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get a platform setting by key
 * @param req Request
 * @param res Response
 */
export declare const getPlatformSettingByKey: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Create a new platform setting
 * @param req Request
 * @param res Response
 */
export declare const createPlatformSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update a platform setting
 * @param req Request
 * @param res Response
 */
export declare const updatePlatformSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete a platform setting
 * @param req Request
 * @param res Response
 */
export declare const deletePlatformSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getAllPlatformSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getPlatformSettingByKey: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    createPlatformSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updatePlatformSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    deletePlatformSetting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
