import { Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { handleError } from '../utils/errorHandler'

/**
 * Organization Controller
 * Handles API endpoints for managing organizations
 */
export class OrganizationController {
    /**
     * Get all organizations
     * @param req Request
     * @param res Response
     */
    static async getAllOrganizations(req: Request, res: Response) {
        try {
            // Get organizations from Supabase
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('name', { ascending: true })
            
            if (error) throw error
            
            return res.json({ organizations: data || [] })
        } catch (error) {
            return handleError(res, error, 'Error fetching organizations')
        }
    }

    /**
     * Get a specific organization by ID
     * @param req Request
     * @param res Response
     */
    static async getOrganizationById(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Get organization from Supabase
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', id)
                .single()
            
            if (error) throw error
            if (!data) return res.status(404).json({ error: 'Organization not found' })
            
            return res.json({ organization: data })
        } catch (error) {
            return handleError(res, error, 'Error fetching organization')
        }
    }

    /**
     * Create a new organization
     * @param req Request
     * @param res Response
     */
    static async createOrganization(req: Request, res: Response) {
        try {
            const { name, description } = req.body
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' })
            }
            
            // Create the organization in Supabase
            const { data, error } = await supabase
                .from('organizations')
                .insert({ name, description })
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ organization: data })
        } catch (error) {
            return handleError(res, error, 'Error creating organization')
        }
    }

    /**
     * Update an existing organization
     * @param req Request
     * @param res Response
     */
    static async updateOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { name, description } = req.body
            
            // Update the organization in Supabase
            const { data, error } = await supabase
                .from('organizations')
                .update({ name, description })
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            return res.json({ organization: data })
        } catch (error) {
            return handleError(res, error, 'Error updating organization')
        }
    }

    /**
     * Delete an organization
     * @param req Request
     * @param res Response
     */
    static async deleteOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params
            
            // Delete the organization from Supabase
            const { error } = await supabase
                .from('organizations')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            return res.json({ success: true })
        } catch (error) {
            return handleError(res, error, 'Error deleting organization')
        }
    }
} 