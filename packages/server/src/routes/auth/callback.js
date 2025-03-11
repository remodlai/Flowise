"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../../utils/supabase");
const router = express_1.default.Router();
/**
 * Handle OAuth callback from social login
 */
router.get('/', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;
        // If there's an error from the OAuth provider
        if (error) {
            console.error('OAuth callback error:', error, error_description);
            return res.redirect(`${process.env.CLIENT_URL || ''}/auth/error?error=${encodeURIComponent(error_description || 'OAuth authentication failed')}`);
        }
        // Supabase will handle the callback automatically via the SDK
        // but we can add custom logic here if needed
        // Redirect to the client application
        return res.redirect(`${process.env.CLIENT_URL || ''}/auth/success`);
    }
    catch (error) {
        console.error('Server error handling OAuth callback:', error);
        return res.redirect(`${process.env.CLIENT_URL || ''}/auth/error?error=${encodeURIComponent('Server error during authentication')}`);
    }
});
/**
 * Exchange a code for a session (PKCE flow)
 */
router.post('/exchange', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        const { data, error } = await supabase_1.supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error('Code exchange error:', error);
            return res.status(400).json({ error: error.message });
        }
        if (!data.user || !data.session) {
            return res.status(400).json({ error: 'Invalid authentication response' });
        }
        const user = {
            userId: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider || 'oauth',
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
        console.error('Server error during code exchange:', error);
        return res.status(500).json({ error: 'Server error during code exchange' });
    }
});
exports.default = router;
//# sourceMappingURL=callback.js.map