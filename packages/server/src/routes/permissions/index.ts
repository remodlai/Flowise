import express from 'express'
import { CustomRoleController } from '../../controllers/CustomRoleController'

const router = express.Router()

// Permissions routes
router.get('/', CustomRoleController.getAllPermissions)
router.get('/categories', CustomRoleController.getPermissionCategories)
router.get('/check', CustomRoleController.checkUserPermission)

export default router 