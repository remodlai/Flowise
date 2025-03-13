import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'
import { ISupabaseUser, ISupabaseOrganization, ISupabaseOrganizationUser, ISupabaseUserRole } from '../Interface.Supabase'
import { IUser } from '../Interface'
import { checkPermission } from '../utils/authorizationUtils'

/**
 * User Controller
 * Handles API endpoints for managing users
 */
let consoleLogger = true
export class UserController {
    /**
     * Get all users
     * @param req Request
     * @param res Response
     * @param appId - The application ID to filter users by
     * @param orgId - The organization ID to filter users by
     * @param isServiceUser - Whether to filter users by service user
   
     */
    static async getAllUsers(req: Request, res: Response) {
        try {
            console.log('Getting all users...')
           // console.log('Request headers:', req.headers)
            //console.log('Request user:', req.user)
            //console.log('Request applicationId:', req.applicationId)

            let appId = req.params.appId || null
            let orgId = req.params.orgId || null
            let userContextLevel = ''
            switch (true) {
                case appId !== null:
                    userContextLevel = 'application'
                case orgId !== null:
                    userContextLevel = 'organization'
                default:
                    userContextLevel = 'global'
            }   

            if (consoleLogger) {
                console.log(`User context level: ${userContextLevel}`)
            }
           
           
              

            // Check if user has permission to read users

            const hasPlatformReadUsersPermission = await checkPermission(req.user, 'platform.read_users');
            const hasOrgReadUsersPermission = await checkPermission(req.user, 'org.read_users');
            const hasAppReadUsersPermission = await checkPermission(req.user, 'app.read_users');
            // we check if the user has the required permissions to read users for the given context level
            if (!hasPlatformReadUsersPermission && !hasOrgReadUsersPermission && !hasAppReadUsersPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden - Missing required permissions to read users for ${userContextLevel} context`
                });
            }
            // we set the scope level based on the request parameters
            let scopeLevel = ''
            if (userContextLevel === 'application' && appId !== null && hasAppReadUsersPermission) {
                scopeLevel = 'application'
            } else if (userContextLevel === 'organization' && orgId !== null && hasOrgReadUsersPermission) {
                scopeLevel = 'organization'
            } else if (userContextLevel === 'global' && hasPlatformReadUsersPermission) {
                scopeLevel = 'global'
            } else {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden - Missing required permissions to read users for ${userContextLevel} context`
                });
            }
            if (consoleLogger && scopeLevel !== '') {
                console.log(`Scope level: ${scopeLevel}`)
            }

                 
            const getAuthUsers = async (scopeLevel: string, appId: string | null, orgId: string | null) => {
                try {
                    if (scopeLevel === 'global') {
                        const { data, error } = await supabase.auth.admin.listUsers()
                        if (error) throw error
                        return data.users || []
                    }
                    
                    // For application and organization scopes, we need to filter the users
                    const { data, error } = await supabase.auth.admin.listUsers()
                    if (error) throw error
                    
                    const users = data.users || []
                    
                    if (scopeLevel === 'application' && appId !== null) {
                        return users.filter((user: ISupabaseUser) => 
                            user.user_metadata?.application_id === appId || 
                            user.user_metadata?.application?.id === appId
                        )
                    }
                    
                    if (scopeLevel === 'organization' && orgId !== null) {
                        return users.filter((user: ISupabaseUser) => 
                            user.user_metadata?.organization_id === orgId || 
                            user.user_metadata?.organization?.id === orgId ||
                            (user.user_metadata?.organizations && 
                             user.user_metadata.organizations.some((org: any) => org.id === orgId))
                        )
                    }
                    
                    return []
                } catch (error) {
                    console.error('Error fetching users:', error)
                    throw error
                }
            }
            const authUsers = await getAuthUsers(scopeLevel, appId, orgId)


            
            
            const isServiceUser = req.params.isServiceUser
            const isPlatformAdmin = (req.user as IUser)?.is_platform_admin === true
            
            console.log(`Application context: ${appId}, isPlatformAdmin: ${isPlatformAdmin}`)
            console.log('Current user platform admin debug:', {
                userId: (req.user as any)?.userId,
                is_platform_admin: (req.user as any)?.is_platform_admin,
                raw_user: req.user
            });
            
            
            const formattedUsers = authUsers.map((user: ISupabaseUser) => {
                // Access metadata from user_metadata or directly from JWT claims
                const meta = user.user_metadata || {}
                const primaryOrg = user.user_metadata?.organizations?.[0]
                let organizations = user.user_metadata?.organizations || []
                
                // Enhanced metadata can be in user_metadata or directly in the user object
                const isServiceUser = user.is_service_user || meta.is_service_user || false
                const userStatus = user.user_status || meta.status || (user.email_confirmed_at ? 'active' : 'pending')
                
                // Get the user's role
                const userRole = user.profile_role || meta.role || 'user'
                
                // Check if user is platform admin from all possible sources, including role
                const isPlatformAdmin = user.is_platform_admin || 
                                       meta.is_platform_admin || 
                                       user.app_metadata?.is_platform_admin || 
                                       userRole === 'platform_admin' || 
                                       false
                
                // Debug logging for platform admin status
                console.log('Platform admin debug:', {
                    userId: user.id,
                    email: user.email,
                    user_is_platform_admin: user.is_platform_admin,
                    meta_is_platform_admin: meta.is_platform_admin,
                    app_metadata_is_platform_admin: user.app_metadata?.is_platform_admin,
                    raw_user: user
                });
                
                // Organization info can be in different formats
                const orgInfo = user.organization || {
                    id: meta.organization_id || primaryOrg?.id || null,
                    name: meta.organization_name || primaryOrg?.name || null
                }
                
                // Application info
                const appInfo = user.application || {
                    id: meta.application_id || null,
                    name: meta.application_name || null
                }
                
                // If organizations array is empty but we have organization info, add it to the array
                if (organizations.length === 0 && orgInfo.id) {
                    organizations = [{
                        id: orgInfo.id,
                        name: orgInfo.name || '',
                        role: meta.role || user.profile_role || 'member'
                    }];
                }
                
                // Log the user object for debugging
                if (consoleLogger) {
                    console.log('User object structure:', {
                        id: user.id,
                        hasUserMetadata: !!user.user_metadata,
                        hasIsServiceUser: !!user.is_service_user,
                        hasUserStatus: !!user.user_status,
                        hasOrganization: !!user.organization,
                        hasApplication: !!user.application,
                        organizationsCount: organizations.length,
                        isPlatformAdmin: isPlatformAdmin
                    })
                }
                
                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.first_name || meta.first_name || ''} ${user.last_name || meta.last_name || ''}`.trim() || meta.name || '',
                    firstName: user.first_name || meta.first_name || '',
                    lastName: user.last_name || meta.last_name || '',
                    role: userRole,
                    status: userStatus === 'active' ? 'Active' : 'Pending',
                    lastLogin: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never',
                    createdAt: user.created_at,
                    organization: orgInfo.name || null,
                    organizationId: orgInfo.id || user.organizationId || null,
                    organizationRole: primaryOrg?.role || meta.role || 'member',
                    organizations: organizations,
                    isServiceUser: isServiceUser,
                    application: appInfo.name || null,
                    applicationId: appInfo.id || null,
                    isPlatformAdmin: isPlatformAdmin,
                    userStatus: userStatus
                }
            })

            if (consoleLogger) {
                console.log(`Returning ${formattedUsers.length} users`)
            }
            let users = []
            if (isServiceUser) {

                let serviceUsers = formattedUsers.filter((user: IUser) => user.isServiceUser === true)
                users = serviceUsers
            } else {
                users = formattedUsers
            }
            
            return res.json({ users: users })
        } catch (error) {
            return handleError(res, error, 'Error fetching users')
        }
    }
    


    /**
     * Get all service users
     * @param req Request
     * @param res Response
     */
    static async getAllServiceUsers(req: Request, res: Response) {
        try {
            // Use the Auth Admin API to get all users
            const { data, error } = await supabase.auth.admin.listUsers()
            
            if (error) {
                console.error('Error fetching users:', error)
                throw error
            }
            
            // Filter for service users - check both direct property and metadata
            const serviceUsers = (data.users || []).filter((user: ISupabaseUser) => 
                user.is_service_user === true || user.user_metadata?.is_service_user === true
            )
            
            // Format the service users using the same approach as getAllUsers
            const formattedServiceUsers = serviceUsers.map((user: ISupabaseUser) => {
                const meta = user.user_metadata || {}
                
                // Enhanced metadata can be in user_metadata or directly in the user object
                const userStatus = user.user_status || meta.status || (user.email_confirmed_at ? 'active' : 'pending')
                
                // Get the user's role
                const userRole = user.profile_role || meta.role || 'user'
                
                // Check if user is platform admin from all possible sources, including role
                const isPlatformAdmin = user.is_platform_admin || 
                                       meta.is_platform_admin || 
                                       user.app_metadata?.is_platform_admin || 
                                       userRole === 'platform_admin' || 
                                       false
                
                // Organization info can be in different formats
                const orgInfo = user.organization || {
                    id: meta.organization_id || null,
                    name: meta.organization_name || null
                }
                
                // Application info
                const appInfo = user.application || {
                    id: meta.application_id || null,
                    name: meta.application_name || null
                }
                
                // Get organizations array or initialize empty
                const primaryOrg = user.user_metadata?.organizations?.[0]
                let organizations = user.user_metadata?.organizations || []
                
                // If organizations array is empty but we have organization info, add it to the array
                if (organizations.length === 0 && orgInfo.id) {
                    organizations = [{
                        id: orgInfo.id,
                        name: orgInfo.name || '',
                        role: meta.role || user.profile_role || 'member'
                    }];
                }
                
                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.first_name || meta.first_name || ''} ${user.last_name || meta.last_name || ''}`.trim() || meta.name || '',
                    firstName: user.first_name || meta.first_name || '',
                    lastName: user.last_name || meta.last_name || '',
                    role: userRole,
                    status: userStatus === 'active' ? 'Active' : 'Pending',
                    lastLogin: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never',
                    createdAt: user.created_at,
                    organization: orgInfo.name || null,
                    organizationId: orgInfo.id || user.organizationId || null,
                    organizationRole: primaryOrg?.role || meta.role || 'member',
                    organizations: organizations,
                    application: appInfo.name || null,
                    applicationId: appInfo.id || null,
                    isServiceUser: true,
                    isPlatformAdmin: isPlatformAdmin,
                    userStatus: userStatus
                }
            })
            
            return res.json({ users: formattedServiceUsers })
        } catch (error) {
            return handleError(res, error, 'Error fetching service users')
        }
    }

    /**
     * Get a specific user by ID
     * @param req Request
     * @param res Response
     */
    static async getUserById(req: Request, res: Response) {
        try {
            const { userId } = req.params
            
            // Get user from Supabase Auth
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
            
            if (authError) throw authError
            if (!authUser.user) return res.status(404).json({ error: 'User not found' })
            
            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single()
            
            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error fetching user profile:', profileError)
            }
            
            const user = authUser.user
            const meta = profile?.meta || {}
            const userMetadata = user.user_metadata || {}
            
            // Enhanced metadata can be in user_metadata or directly in the user object
            const isServiceUser = user.is_service_user || userMetadata.is_service_user || false
            const userStatus = user.user_status || userMetadata.status || (user.email_confirmed_at ? 'active' : 'pending')
            
            // Get the user's role
            const userRole = user.profile_role || userMetadata.role || 'user'
            
            // Check if user is platform admin from all possible sources, including role
            const isPlatformAdmin = user.is_platform_admin || 
                                   userMetadata.is_platform_admin || 
                                   user.app_metadata?.is_platform_admin || 
                                   userRole === 'platform_admin' || 
                                   false
            
            // Organization info can be in different formats
            const orgInfo = user.organization || {
                id: userMetadata.organization_id || meta.organization_id || null,
                name: userMetadata.organization_name || meta.organization_name || null
            }
            
            // Application info
            const appInfo = user.application || {
                id: userMetadata.application_id || meta.application_id || null,
                name: userMetadata.application_name || meta.application_name || null
            }
            
            // Get organizations array or initialize empty
            const primaryOrg = userMetadata.organizations?.[0]
            let organizations = userMetadata.organizations || []
            
            // If organizations array is empty but we have organization info, add it to the array
            if (organizations.length === 0 && orgInfo.id) {
                organizations = [{
                    id: orgInfo.id,
                    name: orgInfo.name || '',
                    role: userMetadata.role || user.profile_role || 'member'
                }];
            }
            
            // Check if we have user roles in the JWT claims
            const userRoles = req.user?.user_roles || [];
            const userPermissions = req.user?.user_permissions || [];
            
            // If we don't have roles in JWT claims, fall back to database query
            let dbUserRoles: Array<{
                role: string;
                resource_type: string;
                resource_id: string | null;
            }> = [];
            if (!userRoles.length && userId === req.user?.id) {
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
                    .eq('user_id', userId)
                
                if (rolesError) throw rolesError
                
                // Define a type for the roles data
                interface RoleData {
                    id: string;
                    name: string;
                    base_role: string;
                    context_type: string;
                }
                
                // Transform the roles into a format similar to what was expected from user_roles
                dbUserRoles = userRolesData?.map((ur: ISupabaseUserRole) => {
                    // Get the role data - handle both object and array formats
                    const role = Array.isArray(ur.roles) 
                        ? ur.roles[0] as RoleData
                        : ur.roles as RoleData
                    
                    return {
                        id: ur.id,
                        role: role.name,
                        base_role: role.base_role,
                        context_type: role.context_type,
                        resource_id: ur.resource_id
                    }
                }) || []
            }
            
            // Use JWT roles if available, otherwise use database roles
            const roles = userRoles.length ? userRoles : dbUserRoles;
            
            // Format the response
            const formattedUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name || userMetadata.first_name || meta.first_name || '',
                lastName: user.last_name || userMetadata.last_name || meta.last_name || '',
                name: `${user.first_name || userMetadata.first_name || meta.first_name || ''} ${user.last_name || userMetadata.last_name || meta.last_name || ''}`.trim(),
                organization: orgInfo.name || meta.organization || '',
                organizationId: orgInfo.id || user.organizationId || null,
                organizationRole: primaryOrg?.role || userMetadata.role || 'member',
                organizations: organizations,
                application: appInfo.name || '',
                applicationId: appInfo.id || null,
                status: userStatus === 'active' ? 'Active' : 'Pending',
                createdAt: user.created_at,
                role: userRole,
                roles: roles,
                permissions: userPermissions,
                isPlatformAdmin: isPlatformAdmin,
                isServiceUser: isServiceUser,
                userStatus: userStatus
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
            const { email, password, firstName, lastName, organization, role, applicationId, isPlatformAdmin, isServiceUser } = req.body
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' })
            }
            if (isServiceUser && !applicationId) {
                return res.status(400).json({ error: 'Application ID is required for service users' })
            }
            // Create the user in Supabase Auth

            let name = `${firstName} ${lastName}`.trim()
            if (isServiceUser) {
                name = `${firstName}`.trim()
            }
            
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { 
                    first_name: firstName,
                    last_name: lastName,
                    name: name,
                    organization,
                    role,
                    is_platform_admin: isPlatformAdmin,
                    is_service_user: isServiceUser,
                    application_id: applicationId? applicationId : null
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
                        role,
                        is_platform_admin: isPlatformAdmin,
                        is_service_user: isServiceUser,
                        application_id: applicationId? applicationId : null
                    }
                })
            
            if (profileError) {
                console.error('Error creating user profile:', profileError)
            }
            if (isServiceUser) {
                return res.json({
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        firstName,
                        lastName,
                        name: name,
                        organization,
                        role,
                        status: 'Active',
                        createdAt: data.user.created_at,
                        is_platform_admin: isPlatformAdmin,
                        is_service_user: isServiceUser,
                        application_id: applicationId? applicationId : null
                    },
                    application_id: applicationId? applicationId : null
                })
            } else {
                return res.json({
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        firstName,
                        lastName,
                        name: name,
                        organization,
                        role,
                        status: 'Active',
                        createdAt: data.user.created_at,
                        is_platform_admin: isPlatformAdmin,
                        is_service_user: isServiceUser,
                        application_id: applicationId? applicationId : null
                    },
                    application_id: applicationId? applicationId : null
                })
            }
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
            const { userId } = req.params
            const { email, password, firstName, lastName, organization, role } = req.body
            
            // Update the user in Supabase Auth
            const { data, error } = await supabase.auth.admin.updateUserById(userId, {
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
                .eq('user_id', userId)
                .single()
            
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error checking user profile:', checkError)
            }
            
            // Update or create user profile
            const profileData = {
                user_id: userId,
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
                    .eq('user_id', userId)
                
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
            const { userId } = req.params
            
            // Delete the user from Supabase Auth
            const { error } = await supabase.auth.admin.deleteUser(userId)
            
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
            const { userId } = req.params
            
            console.log(`Getting organizations for user ${userId}`)
            
            // Get organizations this user belongs to
            const { data: orgUsers, error: orgUsersError } = await supabase
                .from('organization_users')
                .select('organization_id, role')
                .eq('user_id', userId)
            
            if (orgUsersError) {
                console.error('Error fetching user organizations:', orgUsersError)
                throw orgUsersError
            }
            
            console.log(`Found ${orgUsers?.length || 0} organization memberships for user ${userId}`)
            
            if (!orgUsers || orgUsers.length === 0) {
                return res.json({ organizations: [] })
            }
            
            // Get organization details
            const orgIds = orgUsers.map((ou: ISupabaseOrganizationUser) => ou.organization_id)
            const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select('*')
                .in('id', orgIds)
            
            if (orgsError) {
                console.error('Error fetching organizations:', orgsError)
                throw orgsError
            }
            
            // Create a map of organization ID to role
            const roleMap = new Map<string, string>()
            orgUsers.forEach((ou: ISupabaseOrganizationUser) => {
                roleMap.set(ou.organization_id, ou.role)
            })
            
            // Add role to each organization
            const orgsWithRoles = organizations.map((org: ISupabaseOrganization) => ({
                ...org,
                role: roleMap.get(org.id) || 'member'
            }))
            
            console.log(`Returning ${orgsWithRoles.length} organizations for user ${userId}`)
            
            return res.json({ organizations: orgsWithRoles })
        } catch (error) {
            return handleError(res, error, 'Error fetching user organizations')
        }
    }
} 