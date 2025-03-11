"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRoleController = void 0;
const supabase_1 = require("../utils/supabase");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Custom Role Controller
 * Handles API endpoints for managing custom roles
 */
class CustomRoleController {
    /**
     * Get all custom roles
     * @param req Request
     * @param res Response
     */
    static async getAllRoles(req, res) {
        try {
            const { context_type, context_id } = req.query;
            let query = supabase_1.supabase.from('roles').select('*');
            if (context_type) {
                query = query.eq('context_type', context_type);
            }
            if (context_id) {
                query = query.eq('context_id', context_id);
            }
            const { data, error } = await query.order('name');
            if (error)
                throw error;
            return res.json({ roles: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching custom roles');
        }
    }
    /**
     * Get a specific custom role by ID
     * @param req Request
     * @param res Response
     */
    static async getRoleById(req, res) {
        try {
            const { id } = req.params;
            // Get role from database
            const { data: role, error } = await supabase_1.supabase
                .from('roles')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!role)
                return res.status(404).json({ error: 'Role not found' });
            // Get permissions for this role
            const { data: rolePermissions, error: permissionsError } = await supabase_1.supabase
                .from('role_permissions')
                .select('permission_id')
                .eq('role_id', id);
            if (permissionsError)
                throw permissionsError;
            // Format permissions as an array of strings
            const permissionList = rolePermissions.map((p) => p.permission_id);
            return res.json({
                role: {
                    ...role,
                    permissions: permissionList
                }
            });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(res, error, 'Error fetching custom role');
        }
    }
    /**
     * Create a new custom role
     * @param req Request
     * @param res Response
     */
    static async createRole(req, res) {
        try {
            const { name, description, base_role, context_type, context_id, permissions } = req.body;
            if (!name || !context_type) {
                return res.status(400).json({ error: 'Name and context_type are required' });
            }
            if (context_type !== 'platform' && !context_id) {
                return res.status(400).json({ error: 'Context ID is required for non-platform roles' });
            }
            // Call the create_custom_role function
            const { data, error } = await supabase_1.supabase.rpc('create_custom_role', {
                p_name: name,
                p_description: description || null,
                p_base_role: base_role || null,
                p_context_type: context_type,
                p_context_id: context_id || null,
                p_permissions: permissions || []
            });
            if (error)
                throw error;
            return res.status(201).json({ id: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error creating custom role');
        }
    }
    /**
     * Update an existing custom role
     * @param req Request
     * @param res Response
     */
    static async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { name, description, base_role, permissions } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            // Start a transaction
            const { error: txError } = await supabase_1.supabase.rpc('begin_transaction');
            if (txError)
                throw txError;
            try {
                // Update the role
                const { error: updateError } = await supabase_1.supabase
                    .from('roles')
                    .update({
                    name,
                    description,
                    base_role,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', id);
                if (updateError)
                    throw updateError;
                // If permissions are provided, update them
                if (permissions) {
                    // Delete existing permissions
                    const { error: deleteError } = await supabase_1.supabase
                        .from('role_permissions')
                        .delete()
                        .eq('role_id', id);
                    if (deleteError)
                        throw deleteError;
                    // Add new permissions
                    if (permissions.length > 0) {
                        const permissionRows = permissions.map((permission) => ({
                            role_id: id,
                            permission
                        }));
                        const { error: insertError } = await supabase_1.supabase
                            .from('role_permissions')
                            .insert(permissionRows);
                        if (insertError)
                            throw insertError;
                    }
                }
                // Commit the transaction
                const { error: commitError } = await supabase_1.supabase.rpc('commit_transaction');
                if (commitError)
                    throw commitError;
                return res.json({ success: true });
            }
            catch (error) {
                // Rollback the transaction on error
                await supabase_1.supabase.rpc('rollback_transaction');
                throw error;
            }
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error updating custom role');
        }
    }
    /**
     * Delete a custom role
     * @param req Request
     * @param res Response
     */
    static async deleteRole(req, res) {
        try {
            const { id } = req.params;
            // Delete the role (cascade will handle permissions)
            const { error } = await supabase_1.supabase
                .from('roles')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return res.json({ success: true });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error deleting custom role');
        }
    }
    /**
     * Get permissions for a role
     * @param req Request
     * @param res Response
     */
    static async getRolePermissions(req, res) {
        try {
            const { id } = req.params;
            // Get permissions for this role
            const { data: rolePermissions, error: permissionsError } = await supabase_1.supabase
                .from('role_permissions')
                .select('permission_id')
                .eq('role_id', id);
            if (permissionsError)
                throw permissionsError;
            // Get full permission details
            const permissionIds = rolePermissions.map((p) => p.permission_id);
            // If no permissions, return empty array
            if (permissionIds.length === 0) {
                return res.json({ permissions: [] });
            }
            // Get permission details
            const { data: permissions, error: permissionsDetailsError } = await supabase_1.supabase
                .from('permissions')
                .select('*')
                .in('id', permissionIds);
            if (permissionsDetailsError)
                throw permissionsDetailsError;
            return res.json({ permissions });
        }
        catch (error) {
            (0, errorHandler_1.handleError)(res, error, 'Error fetching role permissions');
        }
    }
    /**
     * Add permissions to a role
     * @param req Request
     * @param res Response
     */
    static async addRolePermissions(req, res) {
        try {
            const { id } = req.params;
            const { permissions } = req.body;
            if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({ error: 'Permissions array is required' });
            }
            // Create permission rows
            const permissionRows = permissions.map((permission) => ({
                role_id: id,
                permission
            }));
            // Insert permissions
            // Note: Using upsert instead of onConflict for compatibility
            const { error } = await supabase_1.supabase
                .from('role_permissions')
                .upsert(permissionRows, { onConflict: 'role_id,permission' });
            if (error)
                throw error;
            return res.json({ success: true });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error adding role permissions');
        }
    }
    /**
     * Remove a permission from a role
     * @param req Request
     * @param res Response
     */
    static async removeRolePermission(req, res) {
        try {
            const { id, permission } = req.params;
            const { error } = await supabase_1.supabase
                .from('role_permissions')
                .delete()
                .eq('role_id', id)
                .eq('permission', permission);
            if (error)
                throw error;
            return res.json({ success: true });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error removing role permission');
        }
    }
    /**
     * Get users assigned to a role
     * @param req Request
     * @param res Response
     */
    static async getRoleUsers(req, res) {
        try {
            const { id } = req.params;
            const { data, error } = await supabase_1.supabase
                .from('user_roles')
                .select('user_id')
                .eq('role_id', id);
            if (error)
                throw error;
            return res.json({ users: data.map((u) => u.user_id) });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching role users');
        }
    }
    /**
     * Assign a role to a user
     * @param req Request
     * @param res Response
     */
    static async assignRoleToUser(req, res) {
        try {
            const { id } = req.params;
            const { user_id, resource_type, resource_id } = req.body;
            if (!user_id) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const { error } = await supabase_1.supabase
                .from('user_roles')
                .insert({
                user_id,
                role_id: id,
                resource_type,
                resource_id,
                created_by: req.user?.userId
            });
            if (error)
                throw error;
            return res.json({ success: true });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error assigning role to user');
        }
    }
    /**
     * Remove a role from a user
     * @param req Request
     * @param res Response
     */
    static async removeRoleFromUser(req, res) {
        try {
            const { id, user_id } = req.params;
            const { error } = await supabase_1.supabase
                .from('user_roles')
                .delete()
                .eq('role_id', id)
                .eq('user_id', user_id);
            if (error)
                throw error;
            return res.json({ success: true });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error removing role from user');
        }
    }
    /**
     * Get all custom roles for a user
     * @param req Request
     * @param res Response
     */
    static async getUserRoles(req, res) {
        try {
            const { id } = req.params;
            // Use a direct SQL query to bypass RLS
            const { data, error } = await supabase_1.supabase.rpc('get_user_roles_direct', { input_user_id: id });
            if (error)
                throw error;
            return res.json({ roles: data || [] });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching user roles');
        }
    }
    /**
     * Check if a user has a specific permission
     * @param req Request
     * @param res Response
     */
    static async checkUserPermission(req, res) {
        try {
            const { user_id, permission, context_type, context_id } = req.query;
            if (!user_id || !permission) {
                return res.status(400).json({ error: 'User ID and permission are required' });
            }
            // Call the user_has_permission function
            const { data, error } = await supabase_1.supabase.rpc('user_has_permission', {
                p_user_id: user_id,
                p_permission: permission,
                p_context_type: context_type || null,
                p_context_id: context_id || null
            });
            if (error)
                throw error;
            return res.json({ has_permission: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error checking user permission');
        }
    }
    /**
     * Get all available permissions
     * @param req Request
     * @param res Response
     */
    static async getAllPermissions(req, res) {
        try {
            // Get all permissions
            const { data: permissions, error } = await supabase_1.supabase
                .from('permissions')
                .select('*')
                .order('name');
            if (error)
                throw error;
            // Group permissions by category
            const groupedPermissions = permissions.reduce((acc, permission) => {
                const category = permission.category || 'Other';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(permission);
                return acc;
            }, {});
            return res.json({
                categories: Object.values(groupedPermissions)
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching permissions');
        }
    }
    /**
     * Get all permission categories
     * @param req Request
     * @param res Response
     */
    static async getPermissionCategories(req, res) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('permission_categories')
                .select('*')
                .order('name');
            if (error)
                throw error;
            return res.json({ categories: data });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching permission categories');
        }
    }
    /**
     * Get permissions for a role using direct SQL query
     * @param req Request
     * @param res Response
     */
    static async getRolePermissionsDirectSQL(req, res) {
        try {
            const { id } = req.params;
            // Use a direct SQL query to bypass RLS
            const { data, error } = await supabase_1.supabase.rpc('get_role_permissions_direct', { input_role_id: id });
            if (error)
                throw error;
            return res.json({
                permissions: data || [],
                message: 'Permissions fetched using direct SQL query'
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(res, error, 'Error fetching role permissions with direct SQL');
        }
    }
}
exports.CustomRoleController = CustomRoleController;
//# sourceMappingURL=CustomRoleController.js.map