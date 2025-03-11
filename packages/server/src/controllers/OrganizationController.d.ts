import { Request, Response } from 'express';
/**
 * Organization Controller
 * Handles API endpoints for managing organizations
 */
export declare class OrganizationController {
    /**
     * Get all organizations
     * @param req Request
     * @param res Response
     */
    static getAllOrganizations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get a specific organization by ID
     * @param req Request
     * @param res Response
     */
    static getOrganizationById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Create a new organization
     * @param req Request
     * @param res Response
     */
    static createOrganization(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update an existing organization
     * @param req Request
     * @param res Response
     */
    static updateOrganization(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Delete an organization
     * @param req Request
     * @param res Response
     */
    static deleteOrganization(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get members of an organization
     * @param req Request
     * @param res Response
     */
    static getOrganizationMembers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Add a member to an organization
     * @param req Request
     * @param res Response
     */
    static addOrganizationMember(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update a member's role in an organization
     * @param req Request
     * @param res Response
     */
    static updateOrganizationMember(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Remove a member from an organization
     * @param req Request
     * @param res Response
     */
    static removeOrganizationMember(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
