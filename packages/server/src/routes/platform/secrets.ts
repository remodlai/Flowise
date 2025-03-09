import { Request, Response } from 'express'
import { supabase } from '../../utils/supabase'
import logger from '../../utils/logger'
import { StatusCodes } from 'http-status-codes'

/**
 * Get all secrets
 * @param req Request
 * @param res Response
 */
export const getAllSecrets = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('secrets')
            .select('*')
            .order('name')

        if (error) {
            logger.error(`Error getting secrets: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data: data || []
        })
    } catch (error) {
        logger.error(`Error getting secrets: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting secrets'
        })
    }
}

/**
 * Get a secret by ID
 * @param req Request
 * @param res Response
 */
export const getSecretById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const { data, error } = await supabase
            .from('secrets')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (error) {
            logger.error(`Error getting secret by ID: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        if (!data) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Secret with ID ${id} not found`
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        logger.error(`Error getting secret by ID: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting secret by ID'
        })
    }
}

/**
 * Create a new secret
 * @param req Request
 * @param res Response
 */
export const createSecret = async (req: Request, res: Response) => {
    try {
        const { name, type, value, metadata } = req.body

        if (!name || !value) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Name and value are required'
            })
        }

        const { data, error } = await supabase
            .from('secrets')
            .insert({
                name,
                type: type || 'api_key',
                value,
                metadata: metadata || {}
            })
            .select()
            .single()

        if (error) {
            logger.error(`Error creating secret: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        return res.status(StatusCodes.CREATED).json({
            success: true,
            data
        })
    } catch (error) {
        logger.error(`Error creating secret: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error creating secret'
        })
    }
}

/**
 * Update a secret
 * @param req Request
 * @param res Response
 */
export const updateSecret = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { name, type, value, metadata } = req.body

        if (!name || !value) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Name and value are required'
            })
        }

        // Check if secret exists
        const { data: existingData, error: existingError } = await supabase
            .from('secrets')
            .select('id')
            .eq('id', id)
            .maybeSingle()

        if (existingError) {
            logger.error(`Error checking existing secret: ${existingError.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            })
        }

        if (!existingData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Secret with ID ${id} not found`
            })
        }

        const { data, error } = await supabase
            .from('secrets')
            .update({
                name,
                type: type || 'api_key',
                value,
                metadata: metadata || {},
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            logger.error(`Error updating secret: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        logger.error(`Error updating secret: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error updating secret'
        })
    }
}

/**
 * Delete a secret
 * @param req Request
 * @param res Response
 */
export const deleteSecret = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        // Check if secret exists
        const { data: existingData, error: existingError } = await supabase
            .from('secrets')
            .select('id')
            .eq('id', id)
            .maybeSingle()

        if (existingError) {
            logger.error(`Error checking existing secret: ${existingError.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            })
        }

        if (!existingData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Secret with ID ${id} not found`
            })
        }

        const { error } = await supabase
            .from('secrets')
            .delete()
            .eq('id', id)

        if (error) {
            logger.error(`Error deleting secret: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Secret deleted successfully'
        })
    } catch (error) {
        logger.error(`Error deleting secret: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error deleting secret'
        })
    }
}

export default {
    getAllSecrets,
    getSecretById,
    createSecret,
    updateSecret,
    deleteSecret
} 