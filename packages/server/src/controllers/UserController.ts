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
            
            // Get custom roles for users
            const { data: userCustomRoles, error: customRolesError } = await supabase
                .from('user_custom_roles')
                .select(`
                    user_id,
                    custom_roles:role_id (
                        id,
                        name,
                        description,
                        context_type,
                        context_id
                    )
                `)
                .in('user_id', userIds)
            
            if (customRolesError) {
                console.error('Error fetching custom roles:', customRolesError)
            }
            
            // Create a map of user_id to profile
            const profileMap = new Map()
            if (profiles) {
                profiles.forEach(profile => {
                    profileMap.set(profile.user_id, profile)
                })
            }
            
            // Create a map of user_id to custom roles
            const customRolesMap = new Map()
            if (userCustomRoles) {
                userCustomRoles.forEach(ucr => {
                    if (!customRolesMap.has(ucr.user_id)) {
                        customRolesMap.set(ucr.user_id, [])
                    }
                    customRolesMap.get(ucr.user_id).push(ucr.custom_roles)
                })
            }
            
            // Format the response
            const users = authUsers.users.map(user => {
                const profile = profileMap.get(user.id)
                const meta = profile?.meta || {}
                const customRoles = customRolesMap.get(user.id) || []
                
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
                    custom_roles: customRoles,
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
            
            // Get user's roles
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('role, resource_type, resource_id')
                .eq('user_id', id)
            
            if (rolesError) throw rolesError
            
            // Get user's custom roles
            const { data: customRoles, error: customRolesError } = await supabase
                .from('user_custom_roles')
                .select('role_id, custom_roles:custom_roles(name, context_type, context_id)')
                .eq('user_id', id)
            
            if (customRolesError) throw customRolesError
            
            // Format the response
            const user = {
                id: authUser.user.id,
                email: authUser.user.email,
                name: meta.first_name && meta.last_name 
                    ? `${meta.first_name} ${meta.last_name}` 
                    : authUser.user.user_metadata?.name || '',
                firstName: meta.first_name || authUser.user.user_metadata?.first_name || '',
                lastName: meta.last_name || authUser.user.user_metadata?.last_name || '',
                organization: meta.organization || authUser.user.user_metadata?.organization || '',
                role: meta.role || authUser.user.user_metadata?.role || '',
                lastLogin: authUser.user.last_sign_in_at || 'Never',
                status: authUser.user.email_confirmed_at ? 'Active' : 'Pending',
                createdAt: authUser.user.created_at,
                roles: userRoles || [],
                customRoles: customRoles ? customRoles.map((cr: any) => ({
                    id: cr.role_id,
                    name: cr.custom_roles?.name,
                    contextType: cr.custom_roles?.context_type,
                    contextId: cr.custom_roles?.context_id
                })) : []
            }
            
            return res.json({ user })
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