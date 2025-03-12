import { getInstance } from '../index';
import logger from './logger';

/**
 * Check if a user has a specific permission
 * 
 * @param userId The user ID to check
 * @param permission The permission to check (e.g., 'image.read', 'file.create')
 * @returns Promise<boolean> True if the user has the permission, false otherwise
 */
export const hasPermission = async (userId: string, permission: string): Promise<boolean> => {
  try {
    if (!userId) {
      logger.debug('No user ID provided for permission check');
      return false;
    }

    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return false;
    }

    // Call the authorize function in Supabase
    const { data, error } = await app.Supabase.rpc('authorize', {
      requested_permission: permission
    });

    if (error) {
      logger.error(`Error checking permission ${permission}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error(`Error in hasPermission check:`, error);
    return false;
  }
};

/**
 * Check if a user has permission for a specific resource
 * 
 * @param userId The user ID to check
 * @param permission The permission to check (e.g., 'file.read')
 * @param resourceType The type of resource (e.g., 'application', 'organization')
 * @param resourceId The ID of the resource
 * @returns Promise<boolean> True if the user has the permission for the resource, false otherwise
 */
export const hasResourcePermission = async (
  userId: string,
  permission: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> => {
  try {
    if (!userId) {
      logger.debug('No user ID provided for resource permission check');
      return false;
    }

    if (!resourceId) {
      logger.debug(`No resource ID provided for ${resourceType} permission check`);
      return false;
    }

    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return false;
    }

    // Call the authorize_resource function in Supabase
    const { data, error } = await app.Supabase.rpc('authorize_resource', {
      requested_permission: permission,
      resource_type: resourceType,
      resource_id: resourceId
    });

    if (error) {
      logger.error(`Error checking resource permission ${permission} for ${resourceType}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error(`Error in hasResourcePermission check:`, error);
    return false;
  }
};

/**
 * Check if a user is a platform admin
 * 
 * @param user The user object with JWT claims
 * @returns boolean True if the user is a platform admin, false otherwise
 */
export const isPlatformAdmin = (user: any): boolean => {
  return user?.is_platform_admin === true;
};

/**
 * Check if a user has permission, considering platform admin status
 * Platform admins always have all permissions
 * 
 * @param user The user object with JWT claims and userId
 * @param permission The permission to check
 * @returns Promise<boolean> True if the user has the permission, false otherwise
 */
export const checkPermission = async (user: any, permission: string): Promise<boolean> => {
  // No user, no permission
  if (!user || !user.userId) {
    return false;
  }
  
  // Platform admins always have all permissions
  if (isPlatformAdmin(user)) {
    logger.debug(`Platform admin user ${user.userId} granted permission: ${permission}`);
    return true;
  }
  
  // Check specific permission
  const hasAccess = await hasPermission(user.userId, permission);
  
  if (hasAccess) {
    logger.debug(`User ${user.userId} granted permission: ${permission}`);
  } else {
    logger.debug(`User ${user.userId} denied permission: ${permission}`);
  }
  
  return hasAccess;
};

/**
 * Check if a user has permission for a resource, considering platform admin status
 * Platform admins always have all permissions
 * 
 * @param user The user object with JWT claims and userId
 * @param permission The permission to check
 * @param resourceType The type of resource
 * @param resourceId The ID of the resource
 * @returns Promise<boolean> True if the user has the permission for the resource, false otherwise
 */
export const checkResourcePermission = async (
  user: any,
  permission: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> => {
  // No user, no permission
  if (!user || !user.userId) {
    return false;
  }
  
  // Platform admins always have all permissions
  if (isPlatformAdmin(user)) {
    logger.debug(`Platform admin user ${user.userId} granted resource permission: ${permission} for ${resourceType}`);
    return true;
  }
  
  // Check specific resource permission
  const hasAccess = await hasResourcePermission(user.userId, permission, resourceType, resourceId);
  
  if (hasAccess) {
    logger.debug(`User ${user.userId} granted resource permission: ${permission} for ${resourceType} ${resourceId}`);
  } else {
    logger.debug(`User ${user.userId} denied resource permission: ${permission} for ${resourceType} ${resourceId}`);
  }
  
  return hasAccess;
}; 