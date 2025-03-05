import { StatusCodes } from 'http-status-codes'
import { Tool } from '../../database/entities/Tool'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getAppVersion } from '../../utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { FLOWISE_METRIC_COUNTERS, FLOWISE_COUNTER_STATUS } from '../../Interface.Metrics'
import { QueryRunner, In } from 'typeorm'
import logger from '../../utils/logger'

// Dynamic import for applicationtools service
const importApplicationTools = async () => {
    try {
        return await import('../applicationtools')
    } catch (error) {
        logger.error('Error importing applicationtools service:', error)
        return null
    }
}

const createTool = async (requestBody: any): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const newTool = new Tool()
        Object.assign(newTool, requestBody)
        const tool = await appServer.AppDataSource.getRepository(Tool).create(newTool)
        const dbResponse = await appServer.AppDataSource.getRepository(Tool).save(tool)
        
        // Associate tool with application if applicationId is provided
        if (requestBody.applicationId) {
            try {
                const applicationTools = await importApplicationTools()
                if (applicationTools) {
                    await applicationTools.associateToolWithApplication(dbResponse.id, requestBody.applicationId)
                }
            } catch (error) {
                logger.error('Error associating tool with application:', error)
            }
        } else {
            // Associate with default application if no applicationId is provided
            try {
                const applicationTools = await importApplicationTools()
                if (applicationTools) {
                    const defaultAppId = await applicationTools.getDefaultApplicationId()
                    if (defaultAppId) {
                        await applicationTools.associateToolWithApplication(dbResponse.id, defaultAppId)
                    }
                }
            } catch (error) {
                logger.error('Error associating tool with default application:', error)
            }
        }
        
        await appServer.telemetry.sendTelemetry('tool_created', {
            version: await getAppVersion(),
            toolId: dbResponse.id,
            toolName: dbResponse.name
        })
        appServer.metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.TOOL_CREATED, { status: FLOWISE_COUNTER_STATUS.SUCCESS })
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.createTool - ${getErrorMessage(error)}`)
    }
}

const deleteTool = async (toolId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        
        // Remove tool's association with any application
        try {
            const applicationTools = await importApplicationTools()
            if (applicationTools) {
                await applicationTools.removeToolAssociation(toolId)
            }
        } catch (error) {
            logger.error('Error removing tool association:', error)
        }
        
        const dbResponse = await appServer.AppDataSource.getRepository(Tool).delete({
            id: toolId
        })
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.deleteTool - ${getErrorMessage(error)}`)
    }
}

const getAllTools = async (applicationId?: string): Promise<Tool[]> => {
    try {
        const appServer = getRunningExpressApp()
        
        // If applicationId is provided, filter tools by application
        if (applicationId) {
            try {
                const applicationTools = await importApplicationTools()
                if (applicationTools) {
                    const toolIds = await applicationTools.getToolIdsForApplication(applicationId)
                    if (toolIds.length > 0) {
                        return await appServer.AppDataSource.getRepository(Tool).find({
                            where: {
                                id: In(toolIds)
                            }
                        })
                    }
                    return []
                }
            } catch (error) {
                logger.error('Error getting tools for application:', error)
            }
        }
        
        // If no applicationId or error occurred, return all tools
        const dbResponse = await appServer.AppDataSource.getRepository(Tool).find()
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.getAllTools - ${getErrorMessage(error)}`)
    }
}

const getToolById = async (toolId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(Tool).findOneBy({
            id: toolId
        })
        if (!dbResponse) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Tool ${toolId} not found`)
        }
        
        // Get the associated application ID
        try {
            const applicationTools = await importApplicationTools()
            if (applicationTools) {
                const applicationId = await applicationTools.getApplicationIdForTool(toolId)
                if (applicationId) {
                    return { ...dbResponse, applicationId }
                }
            }
        } catch (error) {
            logger.error('Error getting application ID for tool:', error)
        }
        
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.getToolById - ${getErrorMessage(error)}`)
    }
}

const updateTool = async (toolId: string, toolBody: any): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const tool = await appServer.AppDataSource.getRepository(Tool).findOneBy({
            id: toolId
        })
        if (!tool) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Tool ${toolId} not found`)
        }
        
        // Update tool's application association if applicationId is provided
        if (toolBody.applicationId) {
            try {
                const applicationTools = await importApplicationTools()
                if (applicationTools) {
                    await applicationTools.associateToolWithApplication(toolId, toolBody.applicationId)
                }
            } catch (error) {
                logger.error('Error updating tool application association:', error)
            }
            
            // Remove applicationId from toolBody to avoid saving it to the Tool entity
            const { applicationId, ...toolBodyWithoutAppId } = toolBody
            toolBody = toolBodyWithoutAppId
        }
        
        const updateTool = new Tool()
        Object.assign(updateTool, toolBody)
        await appServer.AppDataSource.getRepository(Tool).merge(tool, updateTool)
        const dbResponse = await appServer.AppDataSource.getRepository(Tool).save(tool)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.updateTool - ${getErrorMessage(error)}`)
    }
}

const importTools = async (newTools: Partial<Tool>[], queryRunner?: QueryRunner) => {
    try {
        const appServer = getRunningExpressApp()
        const repository = queryRunner ? queryRunner.manager.getRepository(Tool) : appServer.AppDataSource.getRepository(Tool)

        // step 1 - check whether file tools array is zero
        if (newTools.length == 0) return

        // step 2 - check whether ids are duplicate in database
        let ids = '('
        let count: number = 0
        const lastCount = newTools.length - 1
        newTools.forEach((newTools) => {
            ids += `'${newTools.id}'`
            if (lastCount != count) ids += ','
            if (lastCount == count) ids += ')'
            count += 1
        })

        const selectResponse = await repository.createQueryBuilder('t').select('t.id').where(`t.id IN ${ids}`).getMany()
        const foundIds = selectResponse.map((response) => {
            return response.id
        })

        // step 3 - remove ids that are only duplicate
        const prepTools: Partial<Tool>[] = newTools.map((newTool) => {
            let id: string = ''
            if (newTool.id) id = newTool.id
            if (foundIds.includes(id)) {
                newTool.id = undefined
                newTool.name += ' (1)'
            }
            return newTool
        })

        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepTools)
        
        // step 5 - associate imported tools with default application
        try {
            const applicationTools = await importApplicationTools()
            if (applicationTools) {
                const defaultAppId = await applicationTools.getDefaultApplicationId()
                if (defaultAppId) {
                    // Get the IDs of the newly inserted tools
                    const newToolIds = insertResponse.identifiers.map(identifier => identifier.id)
                    
                    // Associate each tool with the default application
                    for (const toolId of newToolIds) {
                        await applicationTools.associateToolWithApplication(toolId, defaultAppId)
                    }
                }
            }
        } catch (error) {
            logger.error('Error associating imported tools with default application:', error)
        }

        return insertResponse
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.importTools - ${getErrorMessage(error)}`)
    }
}

export default {
    createTool,
    deleteTool,
    getAllTools,
    getToolById,
    updateTool,
    importTools
}
