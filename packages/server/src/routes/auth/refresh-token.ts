import express from 'express';
import { supabase } from '../../utils/supabase';

const router = express.Router();

/**
 * Refresh access token using a refresh token
 */
router.post('/', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Exchange refresh token for a new session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });
    
    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: error.message });
    }
    
    if (!data.session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    return res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router; 