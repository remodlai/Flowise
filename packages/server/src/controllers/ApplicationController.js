"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationController = void 0;
const supabase_1 = require("../utils/supabase");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Application Controller
 * Handles API endpoints for managing applications
 */
class ApplicationController {
    /**
     * Get all applications
     * @param req Request
     * @param res Response
     */
    static async getAllApplications(req, res) {
        try {
            // Use a direct SQL query to bypass RLS
            const { data, error } = await supabase_1.supabase.rpc('get_all_applications_direct');
            if (error)
                throw error;
            return res.json({ applications: data || [] });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching applications');
        }
    }
    /**
     * Get a specific application by ID
     * @param req Request
     * @param res Response
     */
    static async getApplicationById(req, res) {
        try {
            const { id } = req.params;
            // Get application from Supabase
            const { data, error } = await supabase_1.supabase
                .from('applications')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!data)
                return res.status(404).json({ error: 'Application not found' });
            return res.json({ application: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching application');
        }
    }
    /**
     * Get applications for the current user
     * @param req Request
     * @param res Response
     */
    static async getUserApplications(req, res) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const userId = req.user.userId;
            // Check if user is platform admin from JWT claim
            const isPlatformAdmin = req.user?.is_platform_admin === true;
            console.log('User requesting applications:', {
                userId,
                isPlatformAdmin,
                first_name: req.user?.first_name,
                last_name: req.user?.last_name
            });
            // Use the standard query which will apply RLS policies
            // The RLS policies should allow platform admins to see all applications
            // and regular users to see applications they have access to
            const { data, error } = await supabase_1.supabase
                .from('applications')
                .select('id, name, description, logo_url, url, version, type, status')
                .order('name');
            if (error) {
                console.error('Error fetching applications:', error);
                throw error;
            }
            console.log(`Found ${data?.length || 0} applications through RLS`);
            // Get user roles from JWT claim to determine admin status
            const userRoles = req.user?.user_roles || [];
            // Add is_admin flag based on user roles
            const applications = (data || []).map((app) => {
                // Platform admins are admins of all applications
                if (isPlatformAdmin)
                    return { ...app, is_admin: true };
                // Check if user has admin role for this application
                const isAdmin = userRoles.some((role) => role.resource_type === 'application' &&
                    role.resource_id === app.id &&
                    ['application_admin', 'application_owner', 'app_admin', 'app_owner'].includes(role.role));
                return { ...app, is_admin: isAdmin };
            });
            return res.json(applications);
        }
        catch (error) {
            console.error('Error in getUserApplications:', error);
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching user applications');
        }
    }
    /**
     * Create a new application
     * @param req Request
     * @param res Response
     */
    static async createApplication(req, res) {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            // Create the application in Supabase
            const { data, error } = await supabase_1.supabase
                .from('applications')
                .insert({ name, description })
                .select()
                .single();
            if (error)
                throw error;
            return res.json({ application: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error creating application');
        }
    }
    /**
     * Update an existing application
     * @param req Request
     * @param res Response
     */
    static async updateApplication(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            // Update the application in Supabase
            const { data, error } = await supabase_1.supabase
                .from('applications')
                .update({ name, description })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return res.json({ application: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error updating application');
        }
    }
    /**
     * Delete an application
     * @param req Request
     * @param res Response
     */
    static async deleteApplication(req, res) {
        try {
            const { id } = req.params;
            // Delete the application from Supabase
            const { error } = await supabase_1.supabase
                .from('applications')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return res.json({ success: true });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error deleting application');
        }
    }
}
exports.ApplicationController = ApplicationController;
//# sourceMappingURL=ApplicationController.js.map