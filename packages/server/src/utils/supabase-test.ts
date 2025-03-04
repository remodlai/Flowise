import express from 'express';
import { supabase } from './supabase';

const router = express.Router();

router.get('/test', async (req, res) => {
  try {
    // Just check if we can get the Supabase settings
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return res.status(500).json({ error: error.message, details: 'Supabase connection failed' });
    }
    
    return res.json({ 
      message: 'Supabase connection successful',
      data
    });
  } catch (error) {
    console.error('Server error testing Supabase:', error);
    return res.status(500).json({ error: 'Server error testing Supabase connection' });
  }
});

export default router;