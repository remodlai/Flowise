import express from 'express'
import { CustomRoleController } from '../../controllers/CustomRoleController'

const router = express.Router()

// User roles routes - The :id parameter is handled by the parent router
router.get('/', CustomRoleController.getUserRoles)

export default router 