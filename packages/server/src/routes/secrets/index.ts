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
        const { applicationId } = req.query

        logger.debug(`========= Start of GET /api/v1/secrets/:id endpoint =========`)
        logger.debug(`Secret ID: ${id}`)
        logger.debug(`Application ID from query: ${applicationId || 'not provided'}`)
        logger.debug(`All query parameters: ${JSON.stringify(req.query)}`)

        if (!id) {
            logger.debug(`Error: Secret ID is required`)
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: 'Secret ID is required'
            })
        }

        // Get the secret from Supabase, passing the applicationId if provided
        logger.debug(`Calling getSecret with ID: ${id} and applicationId: ${applicationId || 'not provided'}`)
        const data = await getSecret(id, applicationId as string)
        logger.debug(`getSecret returned data: ${data ? 'data received' : 'no data'}`)

        logger.debug(`Returning success response`)
        logger.debug(`========= End of GET /api/v1/secrets/:id endpoint =========`)
        return res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error: any) {
        logger.error(`Error getting secret by ID: ${error}`)
        logger.debug(`Error stack: ${error.stack}`)
        logger.debug(`========= End of GET /api/v1/secrets/:id endpoint with error =========`)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Error getting secret by ID'
        })
    }
})

export default router 