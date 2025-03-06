import { createClient } from '@supabase/supabase-js'
import { Request, Response, NextFunction } from 'express'
import { IUser } from '../Interface'

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authorization utility functions
export const checkUserRole = async (userId: string, role: string, entityId?: string): Promise<boolean> => {
  try {
    console.log(`Checking if user ${userId} has role ${role} ${entityId ? `for entity ${entityId}` : ''}`);
    
    // First, get the role ID for the specified role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .maybeSingle();
    
    if (roleError) {
      console.error('Error fetching role:', roleError);
      return false;
    }
    
    if (!roleData) {
      console.error(`Role '${role}' not found`);
      return false;
    }
    
    // Now check if the user has this role
    let query = supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role_id', roleData.id);
    
    // If entityId is provided, filter by resource_id
    if (entityId) {
      query = query.eq('resource_id', entityId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      console.error(`Error checking role:`, error);
      return false;
    }
    
    // For platform_admin, always return true if they have the role
    // regardless of entity
    if (role === 'platform_admin' && data) {
      return true;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error checking ${role} status:`, error);
    return false;
  }
};

// Check if user is platform admin
export const isPlatformAdmin = async (userId: string): Promise<boolean> => {
  return checkUserRole(userId, 'platform_admin');
};

// Check if user is org admin for a specific org
export const isOrgAdmin = async (userId: string, orgId: string): Promise<boolean> => {
  return checkUserRole(userId, 'org_admin', orgId);
};

// Check if user is app owner for a specific app
export const isAppOwner = async (userId: string, appId: string): Promise<boolean> => {
  // For platform admins, always return true
  const isUserPlatformAdmin = await isPlatformAdmin(userId);
  if (isUserPlatformAdmin) {
    return true;
  }
  
  // For regular users, check if they have app_admin role
  // Note: We're using app_admin instead of app_owner since that's what exists in our schema
  return checkUserRole(userId, 'app_admin', appId);
};

// Middleware to check if user is platform admin
export const requirePlatformAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = req.user as IUser | undefined;
  
  if (!user || !user.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const isAdmin = await isPlatformAdmin(user.userId);
  
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden - Not a platform admin' });
    return;
  }
  
  next();
};

// Middleware to check if user is org admin
export const requireOrgAdmin = (orgId: string) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = req.user as IUser | undefined;
  const targetOrgId = orgId || req.params.orgId;
  
  if (!user || !user.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  if (!targetOrgId) {
    res.status(400).json({ error: 'Organization ID is required' });
    return;
  }
  
  const isAdmin = await isOrgAdmin(user.userId, targetOrgId);
  
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden - Not an organization admin' });
    return;
  }
  
  next();
};