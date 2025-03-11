"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../../utils/supabase");
const router = express_1.default.Router();
/**
 * Send Magic Link for passwordless authentication
 */
router.post('/', async (req, res) => {
    try {
        const { email, redirectTo } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Send magic link email
        //Set the redirect url to the platform url
        const { data, error } = await supabase_1.supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectTo || process.env.AUTH_REDIRECT_URL || '',
            }
        });
        if (error) {
            console.error('Magic link error:', error);
            return res.status(400).json({ error: error.message });
        }
        return res.json({
            message: 'Magic link sent successfully! Check your email.',
            data
        });
    }
    catch (error) {
        console.error('Server error sending magic link:', error);
        return res.status(500).json({ error: 'Server error during magic link generation' });
    }
});
/**
 * Verify OTP from magic link or manually entered code
 */
router.post('/verify', async (req, res) => {
    try {
        const { email, token } = req.body;
        if (!email || !token) {
            return res.status(400).json({ error: 'Email and token are required' });
        }
        // Verify the OTP token
        const { data, error } = await supabase_1.supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink'
        });
        if (error) {
            console.error('OTP verification error:', error);
            return res.status(400).json({ error: error.message });
        }
        if (!data.user || !data.session) {
            return res.status(400).json({ error: 'Invalid authentication response' });
        }
        const user = {
            userId: data.user.id,
            email: data.user.email,
            provider: 'email',
            userMetadata: data.user.user_metadata || {}
        };
        return res.json({
            user,
            session: {
                access_token: data.session.access_token,
                expires_at: data.session.expires_at
            }
        });
    }
    catch (error) {
        console.error('Server error during OTP verification:', error);
        return res.status(500).json({ error: 'Server error during OTP verification' });
    }
});
exports.default = router;
//# sourceMappingURL=magic-link.js.map