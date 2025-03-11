import { Request, Response } from 'express';
/**
 * Application Controller
 * Handles API endpoints for managing applications
 */
export declare class ApplicationController {
    /**
     * Get all applications
     * @param req Request
     * @param res Response
     */
    static getAllApplications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get a specific application by ID
     * @param req Request
     * @param res Response
     */
    static getApplicationById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get applications for the current user
     * @param req Request
     * @param res Response
     */
    static getUserApplications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Create a new application
     * @param req Request
     * @param res Response
     */
    static createApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update an existing application
     * @param req Request
     * @param res Response
     */
    static updateApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Delete an application
     * @param req Request
     * @param res Response
     */
    static deleteApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
