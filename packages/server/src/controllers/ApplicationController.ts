import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'
import { checkPermission } from '../utils/authorizationUtils'
import { getInstance } from '../index'
import logger from '../utils/logger'
import { STORAGE_BUCKETS } from '../utils/supabaseStorage'
import { IMAGE_FORMATS, IMAGE_QUALITY, IMAGE_ORIENTATION, IMAGE_ASPECT_RATIOS, IMAGE_COLOR_MODES, IMAGE_PROXY_URL } from '../constants/images'
import caseMaker from '../utils/case'
/**
 * Application Controller
 * Handles API endpoints for managing applications
 */
let consoleLogger =true
export class ApplicationController {
    /**
     * Get all applications
     * @param req Request
     * @param res Response
     */
    static async getAllApplications(req: Request, res: Response) {
        try {
            // Use a direct SQL query to bypass RLS
            const { data, error } = await supabase.rpc('get_all_applications_direct')
            
            if (error) throw error
            
            return res.json({ applications: data || [] })
        } catch (error) {
            return handleError(res, error, 'Error fetching applications')
        }
    }

    /**
     * Get a specific application by ID
     * @param req Request
     * @param res Response
     */
    static async getApplicationById(req: Request, res: Response) {
        try {
            const { appId } = req.params
            
            // Get application from Supabase
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('id', appId)
                .single()
            
            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Application not found' })
            
            return res.json({ application: data })
        } catch (error) {
            return handleError(res, error, 'Error fetching application')
        }
    }

    /**
     * Get applications for the current user
     * @param req Request
     * @param res Response
     */
    static async getUserApplications(req: Request, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' })
            }
            
            const userId = req.user.userId
            
            // Check if user is platform admin from JWT claim
            const isPlatformAdmin = (req.user as any)?.is_platform_admin === true
            
            console.log('User requesting applications:', { 
                userId, 
                isPlatformAdmin,
                first_name: (req.user as any)?.first_name,
                last_name: (req.user as any)?.last_name
            })
            
            // Define application interface
            interface Application {
                id: string;
                name: string;
                description?: string;
                logo_url?: string;
                url?: string;
                version?: string;
                type?: string;
                status?: string;
                is_admin?: boolean;
            }
            
            // Use the standard query which will apply RLS policies
            // The RLS policies should allow platform admins to see all applications
            // and regular users to see applications they have access to
            const { data, error } = await supabase
                .from('applications')
                .select('id, name, description, logo_url, url, version, type, status')
                .order('name')
            
            if (error) {
                console.error('Error fetching applications:', error)
                throw error
            }
            
            console.log(`Found ${data?.length || 0} applications through RLS`)
            
            // Get user roles from JWT claim to determine admin status
            const userRoles = (req.user as any)?.user_roles || []
            
            // Add is_admin flag based on user roles
            const applications = (data || []).map((app: Application) => {
                // Platform admins are admins of all applications
                if (isPlatformAdmin) return { ...app, is_admin: true }
                
                // Check if user has admin role for this application
                const isAdmin = userRoles.some((role: any) => 
                    role.resource_type === 'application' && 
                    role.resource_id === app.id && 
                    ['application_admin', 'application_owner', 'app_admin', 'app_owner'].includes(role.role)
                )
                
                return { ...app, is_admin: isAdmin }
            })
            
            return res.json(applications)
        } catch (error) {
            console.error('Error in getUserApplications:', error)
            return handleError(res, error, 'Error fetching user applications')
        }
    }

    /**
     * Create a new application
     * @param req Request
     * @param res Response
     */
    static async createApplication(req: Request, res: Response) {
        try {
            const { name, description } = req.body
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' })
            }
            
            // Create the application in Supabase
            const { data, error } = await supabase
                .from('applications')
                .insert({ name, description })
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ application: data })
        } catch (error) {
            return handleError(res, error, 'Error creating application')
        }
    }

    /**
     * Update an existing application
     * @param req Request
     * @param res Response
     */
    static async updateApplication(req: Request, res: Response) {
        try {
            const { appId } = req.params
            const { name, description } = req.body
            
            // Update the application in Supabase
            const { data, error } = await supabase
                .from('applications')
                .update({ name, description })
                .eq('id', appId)
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ application: data })
        } catch (error) {
            return handleError(res, error, 'Error updating application')
        }
    }

    /**
     * Get the URL of an application logo
     * @param req Request
     * @param res Response
     * 
     */

    static async getApplicationLogoUrl(req: Request, res: Response) {
        try {
            const { appId } = req.params
            const size = req.query.size as string
            const format = req.query.format as string
            const quality = req.query.quality as string
            const orientation = req.query.orientation as string
            const aspectRatio = req.query.aspectRatio as string
            const colorMode = req.query.colorMode as string
            
            
            // Get the application logo from Supabase
            const app = getInstance();
            if (!app || !app.Supabase) {
                logger.error('Supabase client not initialized');
                return res.status(500).json({ 
                  success: false, 
                  message: 'Internal server error - Supabase client not initialized' 
                });
            }
            const { data, error } =  await app.Supabase?.from('applications').select('logo_url').eq('id', appId).single()
            if (error) throw error
            if (consoleLogger) console.log(`[server][getApplicationLogoUrl] for appId: ${appId} | url: ${data}`);
            return res.json({ url: data })
        } catch (error) {
            return handleError(res, error, 'Error getting application logo URL')
        }
    }


    /**
     * Upload a logo for an application
     * @param req Request
     * @param res Response
     * @appId The ID of the application
     */
    static async uploadApplicationLogo(req: Request, res: Response) {
        try {
            const { appId } = req.params
        
             // Check if user has permission to create images
             const hasPermission = await checkPermission(req.user, 'image.create');
             if (!hasPermission) {
               return res.status(403).json({
                 success: false,
                 message: 'Forbidden - Missing required permission: image.create'
               });
             }
             
             // Check if file was uploaded
             if (!req.file) {
               return res.status(400).json({
                 success: false,
                 message: 'No file uploaded'
               });
             }
             
             // Get the Supabase client from the App instance
             const app = getInstance();
             if (!app || !app.Supabase) {
               logger.error('Supabase client not initialized');
               return res.status(500).json({ 
                 success: false, 
                 message: 'Internal server error - Supabase client not initialized' 
               });
             }
             const appName = await app.Supabase.from('applications').select('name').eq('id', appId).single().then(({ data, error }) => {
                if (error) throw error
                return data?.name
             })

             if (!appName) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found by name. Please check the appId and try again, or update the application metadata'
                });
             }
             
             // Get file details
             const { originalname, mimetype, size, buffer } = req.file;
             const contextType = req.body.contextType || 'platform';
             const contextId = req.body.contextId;
             const description = `Logo for ${appName}`;
             const isPublic = req.body.isPublic === 'true';
             const isShareable = req.body.isShareable === 'false';
             
             
             
             
             // Validate file type
             if (!mimetype.startsWith('image/')) {
               return res.status(400).json({
                 success: false,
                 message: 'File must be an image'
               });
             }
             
             if (!mimetype.includes('png') && !mimetype.includes('svg')) {
                return res.status(400).json({
                    success: false,
                    message: 'File must be a PNG, or svg image. Jpegs don\'t have a transparent background and are not supported.'
                });
             }
            // Generate a unique path for the file
             let normalizedName = originalname.replace(/\s+/g, '_');
             const path =  caseMaker.toSnakeCase(appName) + '/assets/logos/' + `${normalizedName}`;
             const bucket = 'apps';
             
             // Upload file to Supabase Storage
             const { data: uploadData, error: uploadError } = await app.Supabase
               .storage
               .from(bucket)
               .upload(path, buffer, {
                 contentType: mimetype,
                 upsert: true
               });
             
             if (uploadError) {
               logger.error('Error uploading file to storage:', uploadError);
               return res.status(400).json({
                 success: false,
                 message: 'Failed to upload file to storage',
                 error: uploadError.message
               });
             }
             
             // Get the public URL
             //REMODL TODO: We need to check this.  It may not be correct.  referto 
             const { data: urlData } = app.Supabase
               .storage
               .from(bucket)
               .getPublicUrl(path);
             
             if (!urlData) {
               logger.error('Error getting public URL: urlData is null');
               return res.status(500).json({
                 success: false,
                 message: 'Failed to get public URL for uploaded file'
               });
             }
             
             const url = urlData.publicUrl;
             logger.info(`[server][uploadApplicationLogo] for appName: ${appName} | appId: ${appId} | url: ${url}`);
             console.log(`[server][uploadApplicationLogo] for appName: ${appName} | appId: ${appId} | url: ${url}`);
             
             // Check if we have a valid user ID
             const userId = req.user?.userId;
             console.log('User ID from request:', userId);
             console.log('Full user object:', JSON.stringify(req.user, null, 2));
             
             // Variable to store file data
             let fileData: any = null;
             let fileMetadataError = null;
             
             // If we have a valid user ID, try to save file metadata to database
             if (userId) {
                 console.log('Using user ID for file metadata:', userId);
                 const fileMetadata: any = {
                     name: normalizedName,
                     content_type: mimetype,
                     size,
                     url,
                     bucket,
                     path_tokens: [appName, 'assets', 'logos'],
                     context_type: 'application',
                     context_id: appId,
                     resource_type: 'image',
                     is_public: true,
                     access_level: 'public',
                     description,
                     is_shareable: false,
                     is_deleted: false,
                     created_by: userId
                 };
                 
                 const { data, error: fileError } = await app.Supabase
                   .from('files')
                   .insert(fileMetadata)
                   .select()
                   .single();
                   
                 fileData = data;
                 fileMetadataError = fileError;
                 
                 if (fileError) {
                   logger.error('Error saving file metadata:', fileError);
                   // We'll continue with updating the logo_url even if this fails
                 }
             } else {
               logger.warn('No valid user ID found in request. Skipping file metadata insertion.');
             }
             
             // Update the application with the logo URL regardless of file metadata status
             const { data: logoData, error: logoError } = await app.Supabase
               .from('applications')
               .update({
                 logo_url: url
               })
               .eq('id', appId)
               .select()
               .single();
               
             if (logoError) {
               logger.error('Error updating application logo URL:', logoError);
               
               // Try to delete the uploaded file if logo update fails
               await app.Supabase.storage.from(bucket).remove([path]);
               
               return res.status(400).json({
                 success: false,
                 message: 'Failed to update application logo URL',
                 error: logoError.message
               });
             }
             
             if (consoleLogger) console.log(`[server][uploadApplicationLogo] Updated logo URL for appName: ${appName} | appId: ${appId} | url: ${url}`);
             
             // If we had a file metadata error but logo update succeeded, include a warning
             if (fileMetadataError) {
               return res.status(201).json({
                 success: true,
                 message: 'File uploaded and logo updated, but metadata could not be saved',
                 url: url,
                 warning: fileMetadataError.message
               });
             }
             
             return res.status(201).json({
               success: true,
               message: 'File uploaded successfully',
               url: url,
               data: userId ? fileData : { url }
             });
        } catch (error: any) {
            logger.error('Unexpected error in uploadImage:', error);
            return res.status(500).json({
               success: false,
               message: 'Internal server error',
               error: error.message
             });
        }
    }
    
    /**
     * Delete an application
     * @param req Request
     * @param res Response
     */
    static async deleteApplication(req: Request, res: Response) {
        try {
            const { appId } = req.params
            
            // Delete the application from Supabase
            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', appId)
            
            if (error) throw error
            
            return res.json({ success: true })
        } catch (error) {
            return handleError(res, error, 'Error deleting application')
        }
    }
} 

export default ApplicationController;