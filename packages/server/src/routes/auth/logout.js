"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../../utils/supabase");
const supabaseAuth_1 = require("../../utils/supabaseAuth");
const router = express_1.default.Router();
/**
 * User logout
 */
router.post('/', supabaseAuth_1.authenticateUser, async (req, res) => {
    try {
        // The token is already validated by the authenticateUser middleware
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized Access' });
        }
        // Extract the token
        const token = authHeader.split(' ')[1];
        // Sign out from Supabase
        const { error } = await supabase_1.supabase.auth.signOut({
            scope: 'local' // Only sign out from this device
        });
        if (error) {
            console.error('Logout error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.json({
            message: 'Successfully logged out'
        });
    }
    catch (error) {
        console.error('Server error during logout:', error);
        return res.status(500).json({ error: 'Server error during logout' });
    }
});
exports.default = router;
//# sourceMappingURL=logout.js.map