"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../../utils/supabase");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            return res.status(401).json({ error: error.message });
        }
        const user = {
            userId: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider || 'email',
            userMetadata: data.user.user_metadata || {}
        };
        return res.json({
            user,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error during login' });
    }
});
exports.default = router;
//# sourceMappingURL=login.js.map