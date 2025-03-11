import { Request, Response } from 'express';
/**
 * Platform management controller
 */
export declare class PlatformController {
    /**
     * Get all nodes with their enabled status
     * @param req
     * @param res
     */
    getNodesWithEnabledStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Toggle node enabled status
     * @param req
     * @param res
     */
    toggleNodeEnabled(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get all tools with their enabled status
     * @param req
     * @param res
     */
    getToolsWithEnabledStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Toggle tool enabled status
     * @param req
     * @param res
     */
    toggleToolEnabled(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Helper method to get Supabase client from request
     * @param req
     * @returns
     */
    private getSupabaseClient;
}
