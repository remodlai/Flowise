import express from 'express'
import { PlatformController } from '../controllers/PlatformController'
import { checkAuthorization } from '../middlewares/authorizationMiddleware'

const platformController = new PlatformController()
const router = express.Router()

// Get all nodes with their enabled status
router.get('/nodes', checkAuthorization(['platform.admin']), platformController.getNodesWithEnabledStatus.bind(platformController))

// Toggle node enabled status
router.post('/nodes/toggle', checkAuthorization(['platform.admin']), platformController.toggleNodeEnabled.bind(platformController))

// Get all tools with their enabled status
router.get('/tools', checkAuthorization(['platform.admin']), platformController.getToolsWithEnabledStatus.bind(platformController))

// Toggle tool enabled status
router.post('/tools/toggle', checkAuthorization(['platform.admin']), platformController.toggleToolEnabled.bind(platformController))

export default router 