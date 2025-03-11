import { Request, Response } from 'express';
/**
 * Custom Role Controller
 * Handles API endpoints for managing custom roles
 */
export declare class CustomRoleController {
    /**
     * Get all custom roles
     * @param req Request
     * @param res Response
     */
    static getAllRoles(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get a specific custom role by ID
     * @param req Request
     * @param res Response
     */
    static getRoleById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Create a new custom role
     * @param req Request
     * @param res Response
     */
    static createRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update an existing custom role
     * @param req Request
     * @param res Response
     */
    static updateRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Delete a custom role
     * @param req Request
     * @param res Response
     */
    static deleteRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get permissions for a role
     * @param req Request
     * @param res Response
     */
    static getRolePermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Add permissions to a role
     * @param req Request
     * @param res Response
     */
    static addRolePermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Remove a permission from a role
     * @param req Request
     * @param res Response
     */
    static removeRolePermission(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get users assigned to a role
     * @param req Request
     * @param res Response
     */
    static getRoleUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Assign a role to a user
     * @param req Request
     * @param res Response
     */
    static assignRoleToUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Remove a role from a user
     * @param req Request
     * @param res Response
     */
    static removeRoleFromUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get all custom roles for a user
     * @param req Request
     * @param res Response
     */
    static getUserRoles(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Check if a user has a specific permission
     * @param req Request
     * @param res Response
     */
    static checkUserPermission(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get all available permissions
     * @param req Request
     * @param res Response
     */
    static getAllPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get all permission categories
     * @param req Request
     * @param res Response
     */
    static getPermissionCategories(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get permissions for a role using direct SQL query
     * @param req Request
     * @param res Response
     */
    static getRolePermissionsDirectSQL(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
