import { Request, Response } from 'express'
import { supabase } from '../../utils/supabase'
import logger from '../../utils/logger'
import { StatusCodes } from 'http-status-codes'

/**
 * Get all platform settings
 * @param req Request
 * @param res Response
 */
export const getAllPlatformSettings = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .order('key')

        if (error) {
            logger.error(`Error getting platform settings: ${error.message}`)
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
        logger.error(`Error getting platform settings: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting platform settings'
        })
    }
}

/**
 * Get a platform setting by key
 * @param req Request
 * @param res Response
 */
export const getPlatformSettingByKey = async (req: Request, res: Response) => {
    try {
        const { key } = req.params

        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .eq('key', key)
            .maybeSingle()

        if (error) {
            logger.error(`Error getting platform setting by key: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        if (!data) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Platform setting with key ${key} not found`
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        logger.error(`Error getting platform setting by key: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting platform setting by key'
        })
    }
}

/**
 * Create a new platform setting
 * @param req Request
 * @param res Response
 */
export const createPlatformSetting = async (req: Request, res: Response) => {
    try {
        const { key, value, description, is_encrypted } = req.body

        if (!key || !value) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Key and value are required'
            })
        }

        // Check if key already exists
        const { data: existingData, error: existingError } = await supabase
            .from('platform_settings')
            .select('id')
            .eq('key', key)
            .maybeSingle()

        if (existingError) {
            logger.error(`Error checking existing platform setting: ${existingError.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            })
        }

        if (existingData) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                error: `Platform setting with key ${key} already exists`
            })
        }

        const { data, error } = await supabase
            .from('platform_settings')
            .insert({
                key,
                value,
                description,
                is_encrypted: is_encrypted || false
            })
            .select()
            .single()

        if (error) {
            logger.error(`Error creating platform setting: ${error.message}`)
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
        logger.error(`Error creating platform setting: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error creating platform setting'
        })
    }
}

/**
 * Update a platform setting
 * @param req Request
 * @param res Response
 */
export const updatePlatformSetting = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { key, value, description, is_encrypted } = req.body

        if (!key || !value) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Key and value are required'
            })
        }

        // Check if setting exists
        const { data: existingData, error: existingError } = await supabase
            .from('platform_settings')
            .select('id')
            .eq('id', id)
            .maybeSingle()

        if (existingError) {
            logger.error(`Error checking existing platform setting: ${existingError.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            })
        }

        if (!existingData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Platform setting with id ${id} not found`
            })
        }

        const { data, error } = await supabase
            .from('platform_settings')
            .update({
                key,
                value,
                description,
                is_encrypted: is_encrypted || false,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            logger.error(`Error updating platform setting: ${error.message}`)
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
        logger.error(`Error updating platform setting: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error updating platform setting'
        })
    }
}

/**
 * Delete a platform setting
 * @param req Request
 * @param res Response
 */
export const deletePlatformSetting = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        // Check if setting exists
        const { data: existingData, error: existingError } = await supabase
            .from('platform_settings')
            .select('id')
            .eq('id', id)
            .maybeSingle()

        if (existingError) {
            logger.error(`Error checking existing platform setting: ${existingError.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: existingError.message
            })
        }

        if (!existingData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                error: `Platform setting with id ${id} not found`
            })
        }

        const { error } = await supabase
            .from('platform_settings')
            .delete()
            .eq('id', id)

        if (error) {
            logger.error(`Error deleting platform setting: ${error.message}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Platform setting deleted successfully'
        })
    } catch (error) {
        logger.error(`Error deleting platform setting: ${error}`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error deleting platform setting'
        })
    }
}

export default {
    getAllPlatformSettings,
    getPlatformSettingByKey,
    createPlatformSetting,
    updatePlatformSetting,
    deletePlatformSetting
} 