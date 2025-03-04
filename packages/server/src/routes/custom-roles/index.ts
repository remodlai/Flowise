import express from 'express'
import { CustomRoleController } from '../../controllers/CustomRoleController'

const router = express.Router()

// Custom Roles routes
router.get('/', CustomRoleController.getAllRoles)
router.post('/', CustomRoleController.createRole)
router.get('/:id', CustomRoleController.getRoleById)
router.put('/:id', CustomRoleController.updateRole)
router.delete('/:id', CustomRoleController.deleteRole)

// Role permissions routes
router.get('/:id/permissions', CustomRoleController.getRolePermissions)
router.post('/:id/permissions', CustomRoleController.addRolePermissions)
router.delete('/:id/permissions/:permission', CustomRoleController.removeRolePermission)

// Role users routes
router.get('/:id/users', CustomRoleController.getRoleUsers)
router.post('/:id/users', CustomRoleController.assignRoleToUser)
router.delete('/:id/users/:user_id', CustomRoleController.removeRoleFromUser)

export default router 