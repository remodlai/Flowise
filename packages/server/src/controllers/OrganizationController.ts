import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'
import { getCurrentApplicationId } from '../middlewares/applicationContextMiddleware'

/**
 * Organization Controller
 * Handles API endpoints for managing organizations
 */
export class OrganizationController {
    /**
     * Get all organizations
     * @param req Request
     * @param res Response
     */
    static async getAllOrganizations(req: Request, res: Response) {
        try {
            // Get application ID from request context
            const applicationId = getCurrentApplicationId(req)
            const isPlatformAdmin = (req.user as any)?.is_platform_admin === true
            
            console.log(`Getting organizations with application context: ${applicationId}, isPlatformAdmin: ${isPlatformAdmin}`)
            console.log(`User info:`, {
                userId: (req.user as any)?.userId,
                email: (req.user as any)?.email,
                roles: (req.user as any)?.user_roles || []
            })
            
            // For debugging, let's check all organizations in the database
            if (isPlatformAdmin && applicationId === 'global') {
                console.log('Platform admin in global mode - checking all organizations in the database')
                const { data: allOrgs, error: allOrgsError } = await supabase
                    .from('organizations')
                    .select('*')
                
                if (allOrgsError) {
                    console.error('Error fetching all organizations:', allOrgsError)
                } else {
                    console.log(`Found ${allOrgs?.length || 0} total organizations in the database`)
                    if (allOrgs && allOrgs.length > 0) {
                        console.log('Sample organization:', allOrgs[0])
                    }
                }
            }
            
            // Build query
            let query = supabase
                .from('organizations')
                .select('*')
                .order('name', { ascending: true })
            
            // Filter by application if specified and not global
            if (applicationId && applicationId !== 'global') {
                console.log(`Filtering organizations by application_id: ${applicationId}`)
                query = query.eq('application_id', applicationId)
            } else if (!isPlatformAdmin) {
                // Non-platform admins without application context can't see any organizations
                console.log(`User is not a platform admin and no application context, returning empty array`)
                return res.json({ organizations: [] })
            } else {
                console.log(`User is a platform admin in global context, showing all organizations`)
            }
            
            // Execute query
            const { data, error } = await query
            
            if (error) {
                console.error(`Error fetching organizations:`, error)
                throw error
            }
            
            console.log(`Found ${data?.length || 0} organizations`)
            if (data && data.length > 0) {
                console.log(`First organization:`, data[0])
            }
            
            return res.json({ organizations: data || [] })
        } catch (error) {
            return handleError(res, error, 'Error fetching organizations')
        }
    }

    /**
     * Get a specific organization by ID
     * @param req Request
     * @param res Response
     */
    static async getOrganizationById(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Get organization from Supabase
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', id)
                .single()
            
            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Organization not found' })
            
            return res.json({ organization: data })
        } catch (error) {
            return handleError(res, error, 'Error fetching organization')
        }
    }

    /**
     * Create a new organization
     * @param req Request
     * @param res Response
     */
    static async createOrganization(req: Request, res: Response) {
        try {
            const { name, description } = req.body
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' })
            }
            
            // Get application ID from request context
            const applicationId = getCurrentApplicationId(req)
            
            // If no application ID is specified and user is not platform admin, return error
            if (!applicationId && !(req.user as any)?.is_platform_admin) {
                return res.status(400).json({ error: 'Application ID is required' })
            }
            
            // Use the specified application ID or the default one
            const orgApplicationId = req.body.application_id || applicationId
            
            // Create the organization in Supabase
            const { data, error } = await supabase
                .from('organizations')
                .insert({ 
                    name, 
                    description,
                    application_id: orgApplicationId
                })
                .select()
                .single()
            
            if (error) throw error
            
            // Add the current user as an owner of the organization
            if (req.user && (req.user as any).userId) {
                const { error: memberError } = await supabase
                    .from('organization_users')
                    .insert({
                        organization_id: data.id,
                        user_id: (req.user as any).userId,
                        role: 'owner'
                    })
                
                if (memberError) {
                    console.error('Error adding user as organization owner:', memberError)
                }
            }
            
            return res.json({ organization: data })
        } catch (error) {
            return handleError(res, error, 'Error creating organization')
        }
    }

    /**
     * Update an existing organization
     * @param req Request
     * @param res Response
     */
    static async updateOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { name, description, application_id } = req.body
            
            // Update the organization in Supabase
            const { data, error } = await supabase
                .from('organizations')
                .update({ name, description, application_id })
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ organization: data })
        } catch (error) {
            return handleError(res, error, 'Error updating organization')
        }
    }

    /**
     * Delete an organization
     * @param req Request
     * @param res Response
     */
    static async deleteOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Delete the organization from Supabase
            const { error } = await supabase
                .from('organizations')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            return res.json({ success: true })
        } catch (error) {
            return handleError(res, error, 'Error deleting organization')
        }
    }
    
    /**
     * Get members of an organization
     * @param req Request
     * @param res Response
     */
    static async getOrganizationMembers(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Get organization members from Supabase
            const { data: orgUsers, error: orgUsersError } = await supabase
                .from('organization_users')
                .select('user_id, role, created_at')
                .eq('organization_id', id)
            
            if (orgUsersError) throw orgUsersError
            
            // Get user details for each member
            const userIds = orgUsers.map(user => user.user_id)
            
            if (userIds.length === 0) {
                return res.json({ members: [] })
            }
            
            // Get users from Supabase Auth
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
            
            if (authError) throw authError
            
            // Get user profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
                .in('user_id', userIds)
            
            if (profilesError) {
                console.error('Error fetching user profiles:', profilesError)
            }
            
            // Create a map of user_id to profile
            const profileMap = new Map()
            if (profiles) {
                profiles.forEach(profile => {
                    profileMap.set(profile.user_id, profile)
                })
            }
            
            // Filter auth users to only include organization members
            const filteredUsers = authUsers.users.filter(user => userIds.includes(user.id))
            
            // Format the response
            const members = filteredUsers.map(user => {
                const orgUser = orgUsers.find(ou => ou.user_id === user.id)
                const profile = profileMap.get(user.id)
                const meta = profile?.meta || {}
                
                return {
                    id: user.id,
                    email: user.email,
                    name: meta.first_name && meta.last_name 
                        ? `${meta.first_name} ${meta.last_name}` 
                        : user.user_metadata?.name || '',
                    firstName: meta.first_name || user.user_metadata?.first_name || '',
                    lastName: meta.last_name || user.user_metadata?.last_name || '',
                    role: orgUser?.role || 'member',
                    status: user.email_confirmed_at ? 'Active' : 'Pending',
                    joinedAt: orgUser?.created_at || user.created_at
                }
            })
            
            return res.json({ members })
        } catch (error) {
            return handleError(res, error, 'Error fetching organization members')
        }
    }
    
    /**
     * Add a member to an organization
     * @param req Request
     * @param res Response
     */
    static async addOrganizationMember(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { email, role } = req.body
            
            if (!email) {
                return res.status(400).json({ error: 'Email is required' })
            }
            
            // Get user by email
            const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
            
            if (userError) throw userError
            
            const user = userData.users.find(u => u.email === email)
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' })
            }
            
            // Check if user is already a member
            const { data: existingMember, error: memberError } = await supabase
                .from('organization_users')
                .select('*')
                .eq('organization_id', id)
                .eq('user_id', user.id)
                .maybeSingle()
            
            if (memberError) throw memberError
            
            if (existingMember) {
                return res.status(400).json({ error: 'User is already a member of this organization' })
            }
            
            // Add user to organization
            const { data, error } = await supabase
                .from('organization_users')
                .insert({
                    organization_id: id,
                    user_id: user.id,
                    role: role || 'member'
                })
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ member: data })
        } catch (error) {
            return handleError(res, error, 'Error adding organization member')
        }
    }
    
    /**
     * Update a member's role in an organization
     * @param req Request
     * @param res Response
     */
    static async updateOrganizationMember(req: Request, res: Response) {
        try {
            const { id, userId } = req.params
            const { role } = req.body
            
            if (!role) {
                return res.status(400).json({ error: 'Role is required' })
            }
            
            // Update user's role
            const { data, error } = await supabase
                .from('organization_users')
                .update({ role })
                .eq('organization_id', id)
                .eq('user_id', userId)
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ member: data })
        } catch (error) {
            return handleError(res, error, 'Error updating organization member')
        }
    }
    
    /**
     * Remove a member from an organization
     * @param req Request
     * @param res Response
     */
    static async removeOrganizationMember(req: Request, res: Response) {
        try {
            const { id, userId } = req.params
            
            // Remove user from organization
            const { error } = await supabase
                .from('organization_users')
                .delete()
                .eq('organization_id', id)
                .eq('user_id', userId)
            
            if (error) throw error
            
            return res.json({ success: true })
        } catch (error) {
            return handleError(res, error, 'Error removing organization member')
        }
    }
} 