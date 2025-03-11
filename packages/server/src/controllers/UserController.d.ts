import { Request, Response } from 'express';
/**
 * User Controller
 * Handles API endpoints for managing users
 */
export declare class UserController {
    /**
     * Get all users
     * @param req Request
     * @param res Response
     */
    static getAllUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get a specific user by ID
     * @param req Request
     * @param res Response
     */
    static getUserById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Create a new user
     * @param req Request
     * @param res Response
     */
    static createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update an existing user
     * @param req Request
     * @param res Response
     */
    static updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Delete a user
     * @param req Request
     * @param res Response
     */
    static deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get a user's organizations
     * @param req Request
     * @param res Response
     */
    static getUserOrganizations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
