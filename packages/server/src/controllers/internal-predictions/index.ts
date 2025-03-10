import { Request, Response, NextFunction } from 'express'
import { utilBuildChatflow } from '../../utils/buildChatflow'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'
import { MODE } from '../../Interface'
import { createRandomName } from '../../utils/randomNameGenerator'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

// Send input message and get prediction result (Internal)
const createInternalPrediction = async (req: Request, res: Response, next: NextFunction) => {
    console.log('intial req body', req.body)
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
    
    let chatId = req.body.chatId
    console.log('chatId', chatId)
    //console.log('req.body', req.body)
    //console.log('request headers', req.headers)
    
    const sseStreamer = getRunningExpressApp().sseStreamer

    try {
        sseStreamer.addClient(chatId, res)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') //nginx config: https://serverfault.com/a/801629
        res.setHeader('X-Application-Id', req.body.appId || req.headers['x-application-id'])
        res.setHeader('x-application-id', req.body.appId || req.headers['x-application-id'])
       
        res.flushHeaders()
        if (process.env.MODE === MODE.QUEUE) {
            getRunningExpressApp().redisSubscriber.subscribe(chatId)
        }
        //we're passing in our appId, orgId, and userId to the utilBuildChatflow function
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
