import express from 'express'
import { CustomRoleController } from '../controllers/CustomRoleController'
import { UserController } from '../controllers/UserController'
import { authenticateUser } from '../utils/supabaseAuth'
import { requirePlatformAdmin } from '../utils/supabase'

// Create a router for v1 API routes
const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateUser)

// User routes - temporarily removed platform admin requirement for testing
router.get('/users', UserController.getAllUsers)
router.post('/users', UserController.createUser)
router.get('/users/:id', UserController.getUserById)
router.put('/users/:id', UserController.updateUser)
router.delete('/users/:id', UserController.deleteUser)

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

export default router 