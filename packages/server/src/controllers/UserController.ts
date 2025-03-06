import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'

/**
 * User Controller
 * Handles API endpoints for managing users
 */
export class UserController {
    /**
     * Get all users
     * @param req Request
     * @param res Response
     */
    static async getAllUsers(req: Request, res: Response) {
        try {
            console.log('Getting all users...')
            
            // Get users from Supabase Auth
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
            
            if (authError) {
                console.error('Supabase Auth Error:', authError)
                throw authError
            }
            
            console.log('Users retrieved:', authUsers.users.length)
            
            // Get user profiles
            const userIds = authUsers.users.map(user => user.id)
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
                .in('user_id', userIds)
            
            if (profilesError) {
                console.error('Error fetching user profiles:', profilesError)
            }
            
            // Get roles for users
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select(`
                    user_id,
                    roles:role_id (
                        id,
                        name,
                        description,
                        context_type,
                        context_id
                    )
                `)
                .in('user_id', userIds)
            
            if (rolesError) {
                console.error('Error fetching roles:', rolesError)
            }
            
            // Create a map of user_id to profile
            const profileMap = new Map()
            if (profiles) {
                profiles.forEach(profile => {
                    profileMap.set(profile.user_id, profile)
                })
            }
            
            // Create a map of user_id to roles
            const rolesMap = new Map()
            if (userRoles) {
                userRoles.forEach(ur => {
                    if (!rolesMap.has(ur.user_id)) {
                        rolesMap.set(ur.user_id, [])
                    }
                    rolesMap.get(ur.user_id).push(ur.roles)
                })
            }
            
            // Format the response
            const users = authUsers.users.map(user => {
                const profile = profileMap.get(user.id)
                const meta = profile?.meta || {}
                const userRolesList = rolesMap.get(user.id) || []
                
                return {
                    id: user.id,
                    email: user.email,
                    name: meta.first_name && meta.last_name 
                        ? `${meta.first_name} ${meta.last_name}` 
                        : user.user_metadata?.name || '',
                    firstName: meta.first_name || user.user_metadata?.first_name || '',
                    lastName: meta.last_name || user.user_metadata?.last_name || '',
                    organization: meta.organization || user.user_metadata?.organization || '',
                    role: meta.role || user.user_metadata?.role || '',
                    custom_roles: userRolesList,
                    lastLogin: user.last_sign_in_at || 'Never',
                    status: user.email_confirmed_at ? 'Active' : 'Pending',
                    createdAt: user.created_at
                }
            })
            
            return res.json({ users })
        } catch (error) {
            console.error('Error in getAllUsers:', error)
            return handleError(res, error, 'Error fetching users')
        }
    }

    /**
     * Get a specific user by ID
     * @param req Request
     * @param res Response
     */
    static async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Get user from Supabase Auth
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id)
            
            if (authError) throw authError
            if (!authUser.user) return res.status(404).json({ error: 'User not found' })
            
            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', id)
                .single()
            
            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error fetching user profile:', profileError)
            }
            
            const meta = profile?.meta || {}
            
            // Check if we have user roles in the JWT claims
            const userRoles = req.user?.user_roles || [];
            const userPermissions = req.user?.user_permissions || [];
            
            // If we don't have roles in JWT claims, fall back to database query
            let dbUserRoles: Array<{
                role: string;
                resource_type: string;
                resource_id: string | null;
            }> = [];
            if (!userRoles.length && id === req.user?.id) {
                console.log('No roles found in JWT claims, falling back to database query');
                
                // Get user's roles from the user_roles table
                const { data: userRolesData, error: rolesError } = await supabase
                    .from('user_roles')
                    .select(`
                        id,
                        resource_id,
                        resource_type,
                        role_id,
                        roles:role_id(id, name, base_role, context_type)
                    `)
                    .eq('user_id', id)
                
                if (rolesError) throw rolesError
                
                // Define a type for the roles data
                interface RoleData {
                    id: string;
                    name: string;
                    base_role: string;
                    context_type: string;
                }
                
                // Transform the roles into a format similar to what was expected from user_roles
                dbUserRoles = userRolesData?.map(ur => {
                    // Get the role data - handle both object and array formats
                    const role = Array.isArray(ur.roles) 
                        ? ur.roles[0] as RoleData
                        : ur.roles as RoleData;
                    
                    return {
                        role: role?.name || '',
                        resource_type: ur.resource_type || role?.context_type || '',
                        resource_id: ur.resource_id
                    }
                }) || []
            }
            
            // Use JWT roles if available, otherwise use database roles
            const roles = userRoles.length ? userRoles : dbUserRoles;
            
            // Format the response
            const formattedUser = {
                id: authUser.user.id,
                email: authUser.user.email,
                firstName: meta.first_name || '',
                lastName: meta.last_name || '',
                organization: meta.organization || '',
                status: authUser.user.email_confirmed_at ? 'Active' : 'Pending',
                createdAt: authUser.user.created_at,
                roles: roles,
                permissions: userPermissions,
                is_platform_admin: req.user?.is_platform_admin || false
            }
            
            return res.json({ user: formattedUser })
        } catch (error) {
            return handleError(res, error, 'Error fetching user')
        }
    }

    /**
     * Create a new user
     * @param req Request
     * @param res Response
     */
    static async createUser(req: Request, res: Response) {
        try {
            const { email, password, firstName, lastName, organization, role } = req.body
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' })
            }
            
            // Create the user in Supabase Auth
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { 
                    first_name: firstName,
                    last_name: lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    organization,
                    role
                }
            })
            
            if (error) throw error
            
            // Create user profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: data.user.id,
                    meta: {
                        first_name: firstName,
                        last_name: lastName,
                        organization,
                        role
                    }
                })
            
            if (profileError) {
                console.error('Error creating user profile:', profileError)
            }
            
            return res.json({
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    organization,
                    role,
                    status: 'Active',
                    createdAt: data.user.created_at
                }
            })
        } catch (error) {
            return handleError(res, error, 'Error creating user')
        }
    }

    /**
     * Update an existing user
     * @param req Request
     * @param res Response
     */
    static async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { email, password, firstName, lastName, organization, role } = req.body
            
            // Update the user in Supabase Auth
            const { data, error } = await supabase.auth.admin.updateUserById(id, {
                email,
                password,
                user_metadata: { 
                    first_name: firstName,
                    last_name: lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    organization,
                    role
                }
            })
            
            if (error) throw error
            
            // Check if user profile exists
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', id)
                .single()
            
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error checking user profile:', checkError)
            }
            
            // Update or create user profile
            const profileData = {
                user_id: id,
                meta: {
                    first_name: firstName,
                    last_name: lastName,
                    organization,
                    role
                }
            }
            
            let profileError
            
            if (existingProfile) {
                // Update existing profile
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update(profileData)
                    .eq('user_id', id)
                
                profileError = updateError
            } else {
                // Create new profile
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert(profileData)
                
                profileError = insertError
            }
            
            if (profileError) {
                console.error('Error updating user profile:', profileError)
            }
            
            return res.json({
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    organization,
                    role,
                    status: data.user.email_confirmed_at ? 'Active' : 'Pending',
                    lastLogin: data.user.last_sign_in_at || 'Never',
                    createdAt: data.user.created_at
                }
            })
        } catch (error) {
            return handleError(res, error, 'Error updating user')
        }
    }

    /**
     * Delete a user
     * @param req Request
     * @param res Response
     */
    static async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Delete the user from Supabase Auth
            const { error } = await supabase.auth.admin.deleteUser(id)
            
            if (error) throw error
            
            // The user_profile will be automatically deleted due to the ON DELETE CASCADE constraint
            
            return res.json({ success: true })
        } catch (error) {
            return handleError(res, error, 'Error deleting user')
        }
    }
} 