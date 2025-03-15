//This is where we have the routes for refreshing the token from supabase
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
      console.error('Refresh token missing in request');
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    console.log('Attempting to refresh token with Supabase');
    
    // Exchange refresh token for a new session
    /*
    * Removed passing the refresh_token as a parameter, because it's not needed., and ws potentially causing issues.  
    * 
    */
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Token refresh error from Supabase:', error);
      
      // Check for specific error types
      if (error.message.includes('expired')) {
        return res.status(401).json({ 
          error: 'Refresh token has expired',
          code: 'EXPIRED_REFRESH_TOKEN'
        });
      }
      
      if (error.message.includes('invalid')) {
        return res.status(401).json({ 
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        error: error.message,
        code: 'AUTH_ERROR'
      });
    }
    
    if (!data.session) {
      console.error('No session returned from Supabase refresh');
      return res.status(401).json({ 
        error: 'Invalid refresh token - no session returned',
        code: 'NO_SESSION_RETURNED'
      });
    }
    
    const expiresAt = data.session.expires_at || Math.floor(Date.now() / 1000) + 3600; // Default to 1 hour if missing
    console.log('Token refreshed successfully, new expiry:', new Date(expiresAt * 1000).toISOString());
    
    return res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: expiresAt
      }
    });
  } catch (error) {
    console.error('Unexpected error refreshing token:', error);
    return res.status(500).json({ 
      error: 'Failed to refresh token due to server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router; 