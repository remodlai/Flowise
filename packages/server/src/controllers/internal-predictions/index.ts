import { Request, Response, NextFunction } from 'express'
import { utilBuildChatflow } from '../../utils/buildChatflow'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getErrorMessage } from '../../errors/utils'
import { MODE } from '../../Interface'

// Send input message and get prediction result (Internal)
const createInternalPrediction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.body.streaming || req.body.streaming === 'true') {
            createAndStreamInternalPrediction(req, res, next)
            return
        } else {
            //REMODL: Set headers for the response
            if (req.body.appId || req.headers['x-application-id'] ) {
                res.setHeader('X-Application-Id', req.body.appId || req.headers['x-application-id'])
                res.setHeader('x-application-id', req.body.appId || req.headers['x-application-id'])
            }
            if (req.body.orgId || req.headers['x-organization-id']) {
                res.setHeader('X-Organization-Id', req.body.orgId || req.headers['x-organization-id'])
                res.setHeader('x-organization-id', req.body.orgId || req.headers['x-organization-id'])
            }
            if (req.body.userId || req.headers['x-user-id']) {
                res.setHeader('X-User-Id', req.body.userId || req.headers['x-user-id'])
                res.setHeader('x-user-id', req.body.userId || req.headers['x-user-id'])
            }
            const apiResponse = await utilBuildChatflow(req, true)
            if (apiResponse) return res.json(apiResponse)
        }
    } catch (error) {
        next(error)
    }
}

// Send input message and stream prediction result using SSE (Internal)
const createAndStreamInternalPrediction = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.body.chatId
    
    const sseStreamer = getRunningExpressApp().sseStreamer

    try {
        sseStreamer.addClient(chatId, res)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') //nginx config: https://serverfault.com/a/801629
        if (req.body.appId || req.headers['x-application-id']) {
            res.setHeader('X-Application-Id', req.body.appId || req.headers['x-application-id'])
            res.setHeader('x-application-id', req.body.appId || req.headers['x-application-id'])
        }
        if (req.body.orgId || req.headers['x-organization-id']) {
            res.setHeader('X-Organization-Id', req.body.orgId || req.headers['x-organization-id'])
            res.setHeader('x-organization-id', req.body.orgId || req.headers['x-organization-id'])
        }
        if (req.body.userId || req.headers['x-user-id']) {
            res.setHeader('X-User-Id', req.body.userId || req.headers['x-user-id'])
            res.setHeader('x-user-id', req.body.userId || req.headers['x-user-id'])
        }
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
