import express from 'express'
import { isPlatformAdmin } from '../../utils/supabase'
import settingsController from './settings'
import secretsController from './secrets'

const router = express.Router()

// Middleware to check if user is a platform admin
const checkPlatformAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        // Check if user is a platform admin
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const isAdmin = await isPlatformAdmin(userId)
        if (!isAdmin) {
            return res.status(403).json({ error: 'Forbidden - Platform admin access required' })
        }

        next()
    } catch (error) {
        console.error('Error checking platform admin:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Apply platform admin check to all routes
router.use(checkPlatformAdmin)

// Settings routes
router.get('/settings', settingsController.getAllPlatformSettings)
router.get('/settings/:key', settingsController.getPlatformSettingByKey)
router.post('/settings', settingsController.createPlatformSetting)
router.put('/settings/:id', settingsController.updatePlatformSetting)
router.delete('/settings/:id', settingsController.deletePlatformSetting)

// Secrets routes
router.get('/secrets', secretsController.getAllSecrets)
router.get('/secrets/:id', secretsController.getSecretById)
router.post('/secrets', secretsController.createSecret)
router.put('/secrets/:id', secretsController.updateSecret)
router.delete('/secrets/:id', secretsController.deleteSecret)

export default router 