import express from 'express'
import { CustomRoleController } from '../controllers/CustomRoleController'
import { UserController } from '../controllers/UserController'
import { ApplicationController } from '../controllers/ApplicationController'
import { OrganizationController } from '../controllers/OrganizationController'
import { authenticateUser } from '../utils/supabaseAuth'
import platformRoutes from './platform'
import platformAdminRoutes from './platform/index'
import { supabase } from '../utils/supabase'
import { getUserContextFromJWT } from './auth/user-context'

// Create a router for v1 API routes
const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateUser)

// Auth routes
router.get('/auth/user-context', getUserContextFromJWT)

// Platform management routes
router.use('/platform', platformRoutes)

// Platform admin routes (settings, secrets, etc.)
router.use('/platform', platformAdminRoutes)

// User routes - temporarily removed platform admin requirement for testing
router.get('/users', UserController.getAllUsers)
router.post('/users', UserController.createUser)
router.get('/users/:id', UserController.getUserById)
router.put('/users/:id', UserController.updateUser)
router.delete('/users/:id', UserController.deleteUser)
router.get('/users/:id/organizations', UserController.getUserOrganizations)

// Application routes
router.get('/applications', ApplicationController.getAllApplications)
router.post('/applications', ApplicationController.createApplication)
router.get('/applications/:id', ApplicationController.getApplicationById)
router.put('/applications/:id', ApplicationController.updateApplication)
router.delete('/applications/:id', ApplicationController.deleteApplication)
router.get('/user/applications', ApplicationController.getUserApplications)

// Add a debug endpoint for applications
router.get('/debug/user-applications', async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }
        
        const userId = req.user.userId
        const isPlatformAdmin = (req.user as any)?.is_platform_admin === true
        
        console.log('Debug - User requesting applications:', { 
            userId, 
            isPlatformAdmin,
            first_name: (req.user as any)?.first_name,
            last_name: (req.user as any)?.last_name,
            user_roles: (req.user as any)?.user_roles || []
        })
        
        // Use the standard query which will apply RLS policies
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .order('name')
        
        if (error) {
            console.error('Debug - Error fetching applications:', error)
            return res.status(500).json({ error: error.message })
        }
        
        console.log(`Debug - Found ${data?.length || 0} applications through RLS`)
        
        // Get all applications directly (bypassing RLS)
        const { data: allApps, error: allAppsError } = await supabase.rpc('get_all_applications_direct')
        
        if (allAppsError) {
            console.error('Debug - Error fetching all applications:', allAppsError)
        } else {
            console.log(`Debug - Found ${allApps?.length || 0} applications directly`)
        }
        
        return res.json({
            user: {
                userId,
                isPlatformAdmin,
                first_name: (req.user as any)?.first_name,
                last_name: (req.user as any)?.last_name,
                user_roles: (req.user as any)?.user_roles || []
            },
            applications: data || [],
            all_applications: allApps || []
        })
    } catch (err) {
        console.error('Debug - Error in debug endpoint:', err)
        return res.status(500).json({ error: 'Error fetching applications' })
    }
})

// Organization routes
router.get('/organizations', OrganizationController.getAllOrganizations)
router.post('/organizations', OrganizationController.createOrganization)
router.get('/organizations/:id', OrganizationController.getOrganizationById)
router.put('/organizations/:id', OrganizationController.updateOrganization)
router.delete('/organizations/:id', OrganizationController.deleteOrganization)

// Organization members routes
router.get('/organizations/:id/members', OrganizationController.getOrganizationMembers)
router.post('/organizations/:id/members', OrganizationController.addOrganizationMember)
router.put('/organizations/:id/members/:userId', OrganizationController.updateOrganizationMember)
router.delete('/organizations/:id/members/:userId', OrganizationController.removeOrganizationMember)

// Custom Roles routes
router.get('/custom-roles', CustomRoleController.getAllRoles)
router.post('/custom-roles', CustomRoleController.createRole)
router.get('/custom-roles/:id', CustomRoleController.getRoleById)
router.put('/custom-roles/:id', CustomRoleController.updateRole)
router.delete('/custom-roles/:id', CustomRoleController.deleteRole)

// Role permissions routes
router.get('/custom-roles/:id/permissions', CustomRoleController.getRolePermissions)
router.post('/custom-roles/:id/permissions', CustomRoleController.addRolePermissions)
router.delete('/custom-roles/:id/permissions/:permission', CustomRoleController.removeRolePermission)

// Direct SQL route for permissions
router.get('/custom-roles/:id/permissions-direct', CustomRoleController.getRolePermissionsDirectSQL)

// Role users routes
router.get('/custom-roles/:id/users', CustomRoleController.getRoleUsers)

// User roles routes
router.get('/users/:id/custom-roles', CustomRoleController.getUserRoles)

// Permissions routes
router.get('/permissions', CustomRoleController.getAllPermissions)
router.get('/permissions/categories', CustomRoleController.getPermissionCategories)
router.get('/permissions/check', CustomRoleController.checkUserPermission)

// Debug routes
router.get('/debug/user', (req, res) => {
    if (!req.user) {
        return res.json({ authenticated: false, message: 'User not authenticated' })
    }
    
    return res.json({
        authenticated: true,
        userId: req.user.userId,
        isPlatformAdmin: req.user.isPlatformAdmin,
        app_metadata: req.user.app_metadata,
        userMetadata: req.user.userMetadata
    })
})

// Add a debug endpoint for organizations
router.get('/debug/organizations', async (req, res) => {
    try {
        console.log('Debug - Organizations endpoint called')
        console.log('Debug - Headers:', req.headers)
        console.log('Debug - User:', req.user)
        
        // Get application ID from request context
        const applicationId = req.headers['x-application-id'] as string || req.query.applicationId as string
        const isPlatformAdmin = (req.user as any)?.is_platform_admin === true
        
        console.log(`Debug - Getting organizations with application context: ${applicationId}, isPlatformAdmin: ${isPlatformAdmin}`)
        
        // Direct database query to get all organizations
        const { data: allOrgs, error: allOrgsError } = await supabase
            .from('organizations')
            .select('*')
        
        if (allOrgsError) {
            console.error('Debug - Error fetching all organizations:', allOrgsError)
            return res.status(500).json({ error: allOrgsError.message })
        }
        
        console.log(`Debug - Found ${allOrgs?.length || 0} total organizations in the database`)
        
        // Build filtered query based on application context
        let filteredOrgs = allOrgs
        
        if (applicationId && applicationId !== 'global') {
            console.log(`Debug - Filtering organizations by application_id: ${applicationId}`)
            filteredOrgs = allOrgs.filter(org => org.application_id === applicationId)
        } else if (!isPlatformAdmin) {
            console.log(`Debug - User is not a platform admin and no application context, returning empty array`)
            filteredOrgs = []
        }
        
        console.log(`Debug - Returning ${filteredOrgs.length} organizations after filtering`)
        
        return res.json({
            user: {
                userId: (req.user as any)?.userId,
                isPlatformAdmin,
                email: (req.user as any)?.email,
                roles: (req.user as any)?.user_roles || []
            },
            applicationId,
            allOrganizations: allOrgs,
            filteredOrganizations: filteredOrgs
        })
    } catch (err) {
        console.error('Debug - Error in debug organizations endpoint:', err)
        return res.status(500).json({ error: 'Error fetching organizations' })
    }
})

router.get('/debug/applications', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
        
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        
        return res.json({
            count: data.length,
            applications: data
        })
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching applications' })
    }
})

// Public debug routes
router.get('/public/debug', (req, res) => {
    return res.json({
        message: 'Public debug endpoint',
        headers: {
            authorization: req.headers.authorization ? 'Present' : 'Not present'
        }
    })
})

router.get('/public/debug/applications', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
        
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        
        return res.json({
            count: data.length,
            applications: data
        })
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching applications' })
    }
})

router.get('/public/debug/roles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
        
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        
        return res.json({ roles: data })
    } catch (error) {
        console.error('Error fetching roles:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

export default router 