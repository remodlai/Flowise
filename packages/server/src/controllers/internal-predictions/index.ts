import { Request, Response, NextFunction } from 'express'
import { utilBuildChatflow } from '../../utils/buildChatflow'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'
import { MODE } from '../../Interface'
import { createRandomName } from '../../utils/randomNameGenerator'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger'
// Send input message and get prediction result (Internal)
const createInternalPrediction = async (req: Request, res: Response, next: NextFunction) => {
    logger.info('========= Start of createInternalPrediction beginning (from packages/server/src/controllers/internal-predictions/index.ts)=========')
    logger.info(`'intial req body INTERNAL PREDICTION', ${JSON.stringify(req.body)}`)
    logger.info(`'appId INTERNAL PREDICTION', ${req.body.appId}`)
   
   
    logger.info('========= End of createInternalPrediction beginning =========')
    try {
        if (req.body.streaming || req.body.streaming === 'true') {
            createAndStreamInternalPrediction(req, res, next)
            return
        } else {
           
            const apiResponse = await utilBuildChatflow(req, true)
            if (apiResponse) return res.json(apiResponse)
        }
    } catch (error) {
        next(error)
    }
}

// Send input message and stream prediction result using SSE (Internal)
const createAndStreamInternalPrediction = async (req: Request, res: Response, next: NextFunction) => {
    logger.info('========= Start of createAndStreamInternalPrediction beginning (from packages/server/src/controllers/internal-predictions/index.ts) =========')
    let chatId = req.body.chatId
    let appId = req.body.appId
    let orgId = req.body.orgId
    let userId = req.body.userId
    console.log('chatId', chatId)
   
    if (appId && orgId && userId) {
        logger.info('appId, orgId, and userId are present')
    } else {
        logger.info('appId, orgId, or userId is missing')
    }
    logger.info('========= End of createAndStreamInternalPrediction beginning =========')
    const sseStreamer = getRunningExpressApp().sseStreamer

    try {
        sseStreamer.addClient(chatId, res)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') //nginx config: https://serverfault.com/a/801629
        // res.setHeader('X-Application-Id', req.body.appId || req.headers['x-application-id'])
        // res.setHeader('x-application-id', req.body.appId || req.headers['x-application-id'])
       
        res.flushHeaders()
        if (process.env.MODE === MODE.QUEUE) {
            getRunningExpressApp().redisSubscriber.subscribe(chatId)
        }
        //we're passing in our appId, orgId, and userId to the utilBuildChatflow function
        logger.info('========= Start of createAndStreamInternalPrediction utilBuildChatflow - passing in appId, orgId, and userId (from packages/server/src/controllers/internal-predictions/index.ts)=========')
        const apiResponse = await utilBuildChatflow(req, true)
        sseStreamer.streamMetadataEvent(apiResponse.chatId, apiResponse)
    } catch (error) {
        if (chatId) {
            sseStreamer.streamErrorEvent(chatId, getErrorMessage(error))
        }
        next(error)
    } finally {
        sseStreamer.removeClient(chatId)
    }
}
export default {
    createInternalPrediction
}
