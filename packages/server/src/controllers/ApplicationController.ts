import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'
import { checkPermission } from '../utils/authorizationUtils'
import { getInstance } from '../index'
import logger from '../utils/logger'
import { STORAGE_BUCKETS } from '../utils/supabaseStorage'

/**
 * Application Controller
 * Handles API endpoints for managing applications
 */
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
     * Upload a logo for an application
     * @param req Request
     * @param res Response
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
             const appName = await app.Supabase.from('applications').select('name').eq('id', appId).single()

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
             
             if (!mimetype.endsWith('png') && !mimetype.endsWith('svg')) {
                return res.status(400).json({
                    success: false,
                    message: 'File must be a PNG, or svg image. Jpegs don\'t have a transparent background and are not supported.'
                });
             }
             
             // Generate a unique path for the file
             let normalizedName = originalname.replace(/\s+/g, '_');
             const path =  appId + '/assets/logos/' + `${normalizedName}`;
             const bucket = 'applications';
             
             // Upload file to Supabase Storage
             const { data: uploadData, error: uploadError } = await app.Supabase
               .storage
               .from(bucket)
               .upload(path, buffer, {
                 contentType: mimetype,
                 upsert: false
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
             
             const url = urlData?.publicUrl;
             logger.info(`[server][uploadApplicationLogo] for appName: ${appName} | appId: ${appId} | url: ${url}`);
             console.log(`[server][uploadApplicationLogo] for appName: ${appName} | appId: ${appId} | url: ${url}`);
             
             // Save file metadata to database
             const { data: fileData, error: fileError } = await app.Supabase
               .from('files')
               .insert({
                 name: normalizedName,
                 content_type: mimetype,
                 size,
                 url,
                 bucket,
                 path_tokens: [appId, 'assets', 'logos'],
                 context_type: 'application',
                 context_id: appId,
                 resource_type: 'image',
                 is_public: true,
                 access_level: 'public',
                 created_by: req.user?.userId,
                 description,
                 is_shareable: false,
                 is_deleted: false
               })
               .select()
               .single();
             
             if (fileError) {
               logger.error('Error saving file metadata:', fileError);
               
               // Try to delete the uploaded file if metadata save fails
               await app.Supabase.storage.from(bucket).remove([path]);
               
               return res.status(400).json({
                 success: false,
                 message: 'Failed to save file metadata',
                 error: fileError.message
               });
             }
             
             return res.status(201).json({
               success: true,
               message: 'File uploaded successfully',
               url: url,
               data: fileData
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