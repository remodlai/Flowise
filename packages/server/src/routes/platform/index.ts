import express from 'express'
import settingsController from './settings'
import secretsController from './secrets'

const router = express.Router()

// Middleware to check if user is a platform admin
const checkPlatformAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        console.log('Checking if user is platform admin...')
        console.log('Request path:', req.path)
        console.log('Request method:', req.method)
        console.log('Request headers:', req.headers)
        
        // Check if user is a platform admin
        const userId = req.user?.userId
        if (!userId) {
            console.log('No userId found in request')
            return res.status(401).json({ error: 'Unauthorized' })
        }

        console.log('User ID:', userId)
        
        // Use the JWT claim directly instead of making a database call
        const isAdmin = (req.user as any)?.is_platform_admin === true
        console.log('Is platform admin:', isAdmin)
        
        if (!isAdmin) {
            console.log('User is not a platform admin')
            return res.status(403).json({ error: 'Forbidden - Platform admin access required' })
        }

        console.log('User is a platform admin, proceeding to next middleware')
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

// Add a simple test endpoint
router.get('/test', (req, res) => {
    console.log('Platform test endpoint called')
    return res.status(200).json({
        success: true,
        message: 'Platform test endpoint working'
    })
})

export default router 