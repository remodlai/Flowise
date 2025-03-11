"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settings_1 = __importDefault(require("./settings"));
const secrets_1 = __importDefault(require("./secrets"));
const router = express_1.default.Router();
// Middleware to check if user is a platform admin
const checkPlatformAdmin = async (req, res, next) => {
    try {
        console.log('Checking if user is platform admin...');
        console.log('Request path:', req.path);
        console.log('Request method:', req.method);
        console.log('Request headers:', req.headers);
        // Check if user is a platform admin
        const userId = req.user?.userId;
        if (!userId) {
            console.log('No userId found in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('User ID:', userId);
        // Use the JWT claim directly instead of making a database call
        const isAdmin = req.user?.is_platform_admin === true;
        console.log('Is platform admin:', isAdmin);
        if (!isAdmin) {
            console.log('User is not a platform admin');
            return res.status(403).json({ error: 'Forbidden - Platform admin access required' });
        }
        console.log('User is a platform admin, proceeding to next middleware');
        next();
    }
    catch (error) {
        console.error('Error checking platform admin:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
// Apply platform admin check to all routes
router.use(checkPlatformAdmin);
// Settings routes
router.get('/settings', settings_1.default.getAllPlatformSettings);
router.get('/settings/:key', settings_1.default.getPlatformSettingByKey);
router.post('/settings', settings_1.default.createPlatformSetting);
router.put('/settings/:id', settings_1.default.updatePlatformSetting);
router.delete('/settings/:id', settings_1.default.deletePlatformSetting);
// Secrets routes
router.get('/secrets', secrets_1.default.getAllSecrets);
router.get('/secrets/:id', secrets_1.default.getSecretById);
router.post('/secrets', secrets_1.default.createSecret);
router.put('/secrets/:id', secrets_1.default.updateSecret);
router.delete('/secrets/:id', secrets_1.default.deleteSecret);
// Add a simple test endpoint
router.get('/test', (req, res) => {
    console.log('Platform test endpoint called');
    return res.status(200).json({
        success: true,
        message: 'Platform test endpoint working'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map