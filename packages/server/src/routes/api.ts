import express from 'express'
import { CustomRoleController } from '../controllers/CustomRoleController'
import { UserController } from '../controllers/UserController'
import { ApplicationController } from '../controllers/ApplicationController'
import { OrganizationController } from '../controllers/OrganizationController'
import { authenticateUser } from '../utils/supabaseAuth'
import platformRoutes from './platform'
import { supabase } from '../utils/supabase'

// Create a router for v1 API routes
const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateUser)

// Platform management routes
router.use('/platform', platformRoutes)

// User routes - temporarily removed platform admin requirement for testing
router.get('/users', UserController.getAllUsers)
router.post('/users', UserController.createUser)
router.get('/users/:id', UserController.getUserById)
router.put('/users/:id', UserController.updateUser)
router.delete('/users/:id', UserController.deleteUser)

// Application routes
router.get('/applications', ApplicationController.getAllApplications)
router.post('/applications', ApplicationController.createApplication)
router.get('/applications/:id', ApplicationController.getApplicationById)
router.put('/applications/:id', ApplicationController.updateApplication)
router.delete('/applications/:id', ApplicationController.deleteApplication)
router.get('/user/applications', ApplicationController.getUserApplications)

// Organization routes
router.get('/organizations', OrganizationController.getAllOrganizations)
router.post('/organizations', OrganizationController.createOrganization)
router.get('/organizations/:id', OrganizationController.getOrganizationById)
router.put('/organizations/:id', OrganizationController.updateOrganization)
router.delete('/organizations/:id', OrganizationController.deleteOrganization)

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
router.post('/custom-roles/:id/users', CustomRoleController.assignRoleToUser)
router.delete('/custom-roles/:id/users/:user_id', CustomRoleController.removeRoleFromUser)

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
            .from('custom_roles')
            .select('*')
        
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        
        return res.json({
            count: data.length,
            roles: data
        })
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching roles' })
    }
})

export default router 