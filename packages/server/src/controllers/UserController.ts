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
           // console.log('Request headers:', req.headers)
            //console.log('Request user:', req.user)
            //console.log('Request applicationId:', req.applicationId)
            
            // Get users from Supabase Auth
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
            
            if (authError) {
                console.error('Supabase Auth Error:', authError)
                throw authError
            }
            
            console.log('Users retrieved from Supabase Auth:', authUsers.users.length)
            
            // Get application ID from request context
            const applicationId = req.applicationId
            const isPlatformAdmin = (req.user as any)?.is_platform_admin === true
            
            console.log(`Application context: ${applicationId}, isPlatformAdmin: ${isPlatformAdmin}`)
            
            // Filter users by application if an applicationId is specified and not 'global'
            let filteredUsers = authUsers.users
            let userOrganizationsMap = new Map()
            
            // Get all organization users
            const { data: allOrgUsers, error: allOrgUsersError } = await supabase
                .from('organization_users')
                .select('user_id, organization_id, role')
            
            if (allOrgUsersError) {
                console.error('Error fetching all organization users:', allOrgUsersError)
            } else {
                console.log(`Found ${allOrgUsers?.length || 0} total organization user records`)
                
                // Create a map of user ID to their organizations
                allOrgUsers.forEach(ou => {
                    if (!userOrganizationsMap.has(ou.user_id)) {
                        userOrganizationsMap.set(ou.user_id, [])
                    }
                    userOrganizationsMap.get(ou.user_id).push({
                        organization_id: ou.organization_id,
                        role: ou.role
                    })
                })
            }
            
            // Get all organizations
            const { data: allOrganizations, error: allOrgsError } = await supabase
                .from('organizations')
                .select('*')
            
            if (allOrgsError) {
                console.error('Error fetching all organizations:', allOrgsError)
            }
            
            // Create a map of organization ID to organization details
            const organizationsMap = new Map()
            if (allOrganizations) {
                allOrganizations.forEach(org => {
                    organizationsMap.set(org.id, org)
                })
            }
            
            // Only filter if not in global view or not a platform admin
            if (applicationId && applicationId !== 'global') {
                console.log(`Filtering users by application ID: ${applicationId}`)
                
                // Get organizations associated with this application
                const { data: organizations, error: orgError } = await supabase
                    .from('organizations')
                    .select('id')
                    .eq('application_id', applicationId)
                
                if (orgError) {
                    console.error('Error fetching organizations:', orgError)
                } else {
                    console.log(`Found ${organizations?.length || 0} organizations for application ${applicationId}`)
                    
                    if (organizations && organizations.length > 0) {
                        const orgIds = organizations.map(org => org.id)
                        
                        // Get users from these organizations
                        const { data: orgUsers, error: orgUsersError } = await supabase
                            .from('organization_users')
                            .select('user_id')
                            .in('organization_id', orgIds)
                        
                        if (orgUsersError) {
                            console.error('Error fetching organization users:', orgUsersError)
                        } else {
                            console.log(`Found ${orgUsers?.length || 0} users in these organizations`)
                            
                            if (orgUsers && orgUsers.length > 0) {
                                const allowedUserIds = orgUsers.map(u => u.user_id)
                                
                                // Filter users by allowed IDs
                                filteredUsers = filteredUsers.filter(user => allowedUserIds.includes(user.id))
                                console.log(`Filtered to ${filteredUsers.length} users`)
                            } else {
                                console.log('No users found in these organizations')
                                filteredUsers = []
                            }
                        }
                    } else {
                        console.log('No organizations found for this application')
                        filteredUsers = []
                    }
                }
            } else if (!isPlatformAdmin) {
                // Non-platform admins can only see users they have access to
                // For now, return an empty list if not in an application context
                console.log('Non-platform admin with no application context, returning empty list')
                filteredUsers = []
            } else {
                // Platform admin in global view - show all users
                console.log('Platform admin in global view, showing all users')
            }
            
            // Get user profiles
            const { data: userProfiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
            
            if (profilesError) {
                console.error('Error fetching user profiles:', profilesError)
            }
            
            // Create a map of user ID to profile
            const profilesMap = new Map()
            if (userProfiles) {
                userProfiles.forEach(profile => {
                    profilesMap.set(profile.user_id, profile)
                })
            }
            
            // Format user data
            const formattedUsers = filteredUsers.map(user => {
                const profile = profilesMap.get(user.id)
                const meta = profile?.meta || {}
                const userOrgs = userOrganizationsMap.get(user.id) || []
                
                // Find primary organization (first one or null)
                let primaryOrg = null
                if (userOrgs.length > 0) {
                    const orgDetails = organizationsMap.get(userOrgs[0].organization_id)
                    if (orgDetails) {
                        primaryOrg = {
                            id: orgDetails.id,
                            name: orgDetails.name,
                            role: userOrgs[0].role
                        }
                    }
                }
                
                // Get all organizations with details
                const organizations = userOrgs.map((uo: { organization_id: string; role: string }) => {
                    const org = organizationsMap.get(uo.organization_id)
                    return org ? {
                        id: org.id,
                        name: org.name,
                        application_id: org.application_id,
                        role: uo.role
                    } : null
                }).filter(Boolean)
                
                return {
                    id: user.id,
                    email: user.email,
                    name: meta.first_name && meta.last_name 
                        ? `${meta.first_name} ${meta.last_name}` 
                        : user.user_metadata?.name || '',
                    firstName: meta.first_name || user.user_metadata?.first_name || '',
                    lastName: meta.last_name || user.user_metadata?.last_name || '',
                    role: user.user_metadata?.role || 'user',
                    status: user.email_confirmed_at ? 'Active' : 'Pending',
                    lastLogin: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never',
                    createdAt: user.created_at,
                    organization: primaryOrg?.name || null,
                    organizationId: primaryOrg?.id || null,
                    organizationRole: primaryOrg?.role || null,
                    organizations: organizations
                }
            })
            
            return res.json({ users: formattedUsers })
        } catch (error) {
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

    /**
     * Get a user's organizations
     * @param req Request
     * @param res Response
     */
    static async getUserOrganizations(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            console.log(`Getting organizations for user ${id}`)
            
            // Get organizations this user belongs to
            const { data: orgUsers, error: orgUsersError } = await supabase
                .from('organization_users')
                .select('organization_id, role')
                .eq('user_id', id)
            
            if (orgUsersError) {
                console.error('Error fetching user organizations:', orgUsersError)
                throw orgUsersError
            }
            
            console.log(`Found ${orgUsers?.length || 0} organization memberships for user ${id}`)
            
            if (!orgUsers || orgUsers.length === 0) {
                return res.json({ organizations: [] })
            }
            
            // Get organization details
            const orgIds = orgUsers.map(ou => ou.organization_id)
            const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select('*')
                .in('id', orgIds)
            
            if (orgsError) {
                console.error('Error fetching organizations:', orgsError)
                throw orgsError
            }
            
            // Create a map of organization ID to role
            const roleMap = new Map()
            orgUsers.forEach(ou => {
                roleMap.set(ou.organization_id, ou.role)
            })
            
            // Add role to each organization
            const orgsWithRoles = organizations.map(org => ({
                ...org,
                role: roleMap.get(org.id) || 'member'
            }))
            
            console.log(`Returning ${orgsWithRoles.length} organizations for user ${id}`)
            
            return res.json({ organizations: orgsWithRoles })
        } catch (error) {
            return handleError(res, error, 'Error fetching user organizations')
        }
    }
} 