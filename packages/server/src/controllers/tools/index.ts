import { Request, Response, NextFunction } from 'express'
import toolsService from '../../services/tools'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger'

const createTool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: toolsController.createTool - body not provided!`)
        }
        
        // Log the request for debugging
        logger.debug('Creating tool with body:', req.body)
        
        const apiResponse = await toolsService.createTool(req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteTool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: toolsController.deleteTool - id not provided!`)
        }
        const apiResponse = await toolsService.deleteTool(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllTools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get applicationId from query parameters if provided
        const applicationId = req.query.applicationId as string
        
        // Log the request for debugging
        logger.debug('Getting tools with applicationId:', applicationId)
        
        const apiResponse = await toolsService.getAllTools(applicationId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getToolById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: toolsController.getToolById - id not provided!`)
        }
        const apiResponse = await toolsService.getToolById(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateTool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: toolsController.updateTool - id not provided!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: toolsController.deleteTool - body not provided!`)
        }
        
        // Log the request for debugging
        logger.debug('Updating tool with id:', req.params.id, 'and body:', req.body)
        
        const apiResponse = await toolsService.updateTool(req.params.id, req.body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createTool,
    deleteTool,
    getAllTools,
    getToolById,
    updateTool
}
