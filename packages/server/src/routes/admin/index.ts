import express from 'express';
import { requirePlatformAdmin, supabase } from '../../utils/supabase';

const router = express.Router();

// All routes require platform admin
router.use(requirePlatformAdmin);

// Get all platform admins
router.get('/admins', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'platform_admin');
      
    if (error) throw error;
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching platform admins:', error);
    return res.status(500).json({ error: 'Failed to fetch platform admins' });
  }
});

// Add new platform admin
router.post('/admins', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'platform_admin'
      })
      .select();
      
    if (error) throw error;
    
    return res.json(data[0]);
  } catch (error) {
    console.error('Error adding platform admin:', error);
    return res.status(500).json({ error: 'Failed to add platform admin' });
  }
});

// Remove platform admin
router.delete('/admins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'platform_admin');
      
    if (error) throw error;
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing platform admin:', error);
    return res.status(500).json({ error: 'Failed to remove platform admin' });
  }
});

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*');
      
    if (error) throw error;
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Get organization admins
router.get('/organizations/:orgId/admins', async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'org_admin')
      .eq('entity_id', orgId);
      
    if (error) throw error;
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching organization admins:', error);
    return res.status(500).json({ error: 'Failed to fetch organization admins' });
  }
});

// Add organization admin
router.post('/organizations/:orgId/admins', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'org_admin',
        entity_id: orgId
      })
      .select();
      
    if (error) throw error;
    
    return res.json(data[0]);
  } catch (error) {
    console.error('Error adding organization admin:', error);
    return res.status(500).json({ error: 'Failed to add organization admin' });
  }
});

// Get all applications
router.get('/applications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*');
      
    if (error) throw error;
    
    return res.json(data);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

export default router;
