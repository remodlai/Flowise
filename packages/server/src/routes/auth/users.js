"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../../utils/supabase");
const supabaseAuth_1 = require("../../utils/supabaseAuth");
const supabase_2 = require("../../utils/supabase");
const router = express_1.default.Router();
// Protect this route with authentication and admin check
router.use(supabaseAuth_1.authenticateUser);
router.use(supabase_2.requirePlatformAdmin);
router.post('/', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Create the user in Supabase Auth
        const { data, error } = await supabase_1.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const user = {
            userId: data.user.id,
            email: data.user.email,
            provider: 'email',
            userMetadata: {
                name: name || ''
            }
        };
        return res.json({ user });
    }
    catch (error) {
        console.error('User creation error:', error);
        return res.status(500).json({ error: 'Server error during user creation' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map