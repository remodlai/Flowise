import express from 'express'
import { getSecret } from '../../services/secrets'
import logger from '../../utils/logger'
import { StatusCodes } from 'http-status-codes'

const router = express.Router()

/**
 * Get a secret by ID
 * This endpoint is used by the components package to retrieve credential data
 * No authentication is required as this is called internally by the components
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Secret ID is required'
            })
        }

        // Get the secret from Supabase
        const data = await getSecret(id)

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
})

export default router 