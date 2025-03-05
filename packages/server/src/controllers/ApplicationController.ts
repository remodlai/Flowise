import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'

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
            const { id } = req.params
            
            // Get application from Supabase
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('id', id)
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
            const isPlatformAdmin = req.user.isPlatformAdmin || 
                                   req.user.app_metadata?.is_platform_admin || 
                                   req.user.userMetadata?.role === 'platform_admin' ||
                                   req.user.userMetadata?.role === 'superadmin'
            
            console.log('User requesting applications:', { 
                userId, 
                isPlatformAdmin,
                userMetadata: req.user.userMetadata,
                app_metadata: req.user.app_metadata,
                role: req.user.userMetadata?.role
            })
            
            // For platform admins, return all applications
            const { data, error } = await supabase
                .from('applications')
                .select('id, name, description, logo_url, url, version, type, status')
                .order('name')
            
            if (error) {
                console.error('Error fetching applications:', error)
                throw error
            }
            
            console.log(`Found ${data.length} applications`)
            
            // For platform admins, mark all applications as admin
            const applications = data.map((app: any) => ({
                ...app,
                is_admin: isPlatformAdmin
            }))
            
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
            const { id } = req.params
            const { name, description } = req.body
            
            // Update the application in Supabase
            const { data, error } = await supabase
                .from('applications')
                .update({ name, description })
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ application: data })
        } catch (error) {
            return handleError(res, error, 'Error updating application')
        }
    }

    /**
     * Delete an application
     * @param req Request
     * @param res Response
     */
    static async deleteApplication(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Delete the application from Supabase
            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            return res.json({ success: true })
        } catch (error) {
            return handleError(res, error, 'Error deleting application')
        }
    }
} 