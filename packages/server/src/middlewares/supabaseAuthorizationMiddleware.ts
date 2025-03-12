import { Request, Response, NextFunction } from 'express';
import { getInstance } from '../index';
import logger from '../utils/logger';

/**
 * Middleware to check if user has a specific permission using Supabase's authorize function
 * 
 * @param permission The permission to check (e.g., 'image.read', 'file.create')
 * @returns Express middleware function
 */
export const authorize = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
      }

      // Platform admins always have all permissions (from JWT claim)
      const isPlatformAdmin = (req.user as any)?.is_platform_admin === true;
      if (isPlatformAdmin) {
        logger.debug(`Platform admin user ${req.user.userId} granted permission: ${permission}`);
        return next();
      }

      // Get the Supabase client from the App instance
      const app = getInstance();
      if (!app || !app.Supabase) {
        logger.error('Supabase client not initialized');
        return res.status(500).json({ error: 'Internal server error - Supabase client not initialized' });
      }

      // Call the authorize function in Supabase
      const { data, error } = await app.Supabase.rpc('authorize', {
        requested_permission: permission
      });

      if (error) {
        logger.error(`Error checking permission ${permission}:`, error);
        return res.status(500).json({ error: 'Error checking permission' });
      }

      if (!data) {
        logger.debug(`User ${req.user.userId} denied permission: ${permission}`);
        return res.status(403).json({ 
          error: `Forbidden - Missing required permission: ${permission}` 
        });
      }

      logger.debug(`User ${req.user.userId} granted permission: ${permission}`);
      next();
    } catch (error) {
      logger.error(`Authorization middleware error:`, error);
      return res.status(500).json({ error: 'Internal server error during authorization check' });
    }
  };
};

/**
 * Middleware to check if user has permission for a specific resource
 * 
 * @param permission The permission to check (e.g., 'file.read')
 * @param resourceType The type of resource (e.g., 'application', 'organization')
 * @param resourceIdParam The parameter name in the request that contains the resource ID
 * @returns Express middleware function
 */
export const authorizeResource = (permission: string, resourceType: string, resourceIdParam: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
      }

      // Platform admins always have all permissions (from JWT claim)
      const isPlatformAdmin = (req.user as any)?.is_platform_admin === true;
      if (isPlatformAdmin) {
        logger.debug(`Platform admin user ${req.user.userId} granted resource permission: ${permission} for ${resourceType}`);
        return next();
      }

      // Get the resource ID from the request
      const resourceId = req.params[resourceIdParam] || req.query[resourceIdParam] || req.body[resourceIdParam];
      
      if (!resourceId) {
        logger.error(`Resource ID not found in request for parameter: ${resourceIdParam}`);
        return res.status(400).json({ error: `Resource ID not found in request` });
      }

      // Get the Supabase client from the App instance
      const app = getInstance();
      if (!app || !app.Supabase) {
        logger.error('Supabase client not initialized');
        return res.status(500).json({ error: 'Internal server error - Supabase client not initialized' });
      }

      // Call the authorize_resource function in Supabase
      const { data, error } = await app.Supabase.rpc('authorize_resource', {
        requested_permission: permission,
        resource_type: resourceType,
        resource_id: resourceId
      });

      if (error) {
        logger.error(`Error checking resource permission ${permission} for ${resourceType}:`, error);
        return res.status(500).json({ error: 'Error checking resource permission' });
      }

      if (!data) {
        logger.debug(`User ${req.user.userId} denied resource permission: ${permission} for ${resourceType} ${resourceId}`);
        return res.status(403).json({ 
          error: `Forbidden - Missing required permission: ${permission} for ${resourceType}` 
        });
      }

      logger.debug(`User ${req.user.userId} granted resource permission: ${permission} for ${resourceType} ${resourceId}`);
      next();
    } catch (error) {
      logger.error(`Resource authorization middleware error:`, error);
      return res.status(500).json({ error: 'Internal server error during resource authorization check' });
    }
  };
}; 