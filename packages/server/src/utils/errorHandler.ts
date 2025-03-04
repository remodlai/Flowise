import { Response } from 'express'

/**
 * Handle API errors and return appropriate response
 * @param res Express Response object
 * @param error Error object
 * @param defaultMessage Default error message
 * @returns Response with error details
 */
export const handleError = (res: Response, error: any, defaultMessage: string): Response => {
    console.error(`API Error: ${defaultMessage}`, error)
    
    // Handle Supabase errors
    if (error?.code && error?.message) {
        return res.status(400).json({
            error: error.message,
            code: error.code
        })
    }
    
    // Handle other errors
    return res.status(500).json({
        error: defaultMessage,
        details: error?.message || 'Unknown error'
    })
} 