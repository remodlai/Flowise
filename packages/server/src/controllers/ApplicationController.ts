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
            // Get applications from Supabase
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .order('name', { ascending: true })
            
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