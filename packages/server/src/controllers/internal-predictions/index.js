"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buildChatflow_1 = require("../../utils/buildChatflow");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
const logger_1 = __importDefault(require("../../utils/logger"));
// Send input message and get prediction result (Internal)
const createInternalPrediction = async (req, res, next) => {
    logger_1.default.info('========= Start of createInternalPrediction beginning (from packages/server/src/controllers/internal-predictions/index.ts)=========');
    logger_1.default.info(`'intial req body INTERNAL PREDICTION', ${JSON.stringify(req.body)}`);
    logger_1.default.info(`'appId INTERNAL PREDICTION', ${req.body.appId}`);
    logger_1.default.info('========= End of createInternalPrediction beginning =========');
    try {
        if (req.body.streaming || req.body.streaming === 'true') {
            createAndStreamInternalPrediction(req, res, next);
            return;
        }
        else {
            const apiResponse = await (0, buildChatflow_1.utilBuildChatflow)(req, true);
            if (apiResponse)
                return res.json(apiResponse);
        }
    }
    catch (error) {
        next(error);
    }
};
// Send input message and stream prediction result using SSE (Internal)
const createAndStreamInternalPrediction = async (req, res, next) => {
    logger_1.default.info('========= Start of createAndStreamInternalPrediction beginning (from packages/server/src/controllers/internal-predictions/index.ts) =========');
    let chatId = req.body.chatId;
    let appId = req.body.appId;
    let orgId = req.body.orgId;
    let userId = req.body.userId;
    console.log('chatId', chatId);
    if (appId && orgId && userId) {
        logger_1.default.info('appId, orgId, and userId are present');
    }
    else {
        logger_1.default.info('appId, orgId, or userId is missing');
    }
    logger_1.default.info('========= End of createAndStreamInternalPrediction beginning =========');
    const sseStreamer = (0, getRunningExpressApp_1.getRunningExpressApp)().sseStreamer;
    try {
        sseStreamer.addClient(chatId, res);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); //nginx config: https://serverfault.com/a/801629
        // res.setHeader('X-Application-Id', req.body.appId || req.headers['x-application-id'])
        // res.setHeader('x-application-id', req.body.appId || req.headers['x-application-id'])
        res.flushHeaders();
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            (0, getRunningExpressApp_1.getRunningExpressApp)().redisSubscriber.subscribe(chatId);
        }
        //we're passing in our appId, orgId, and userId to the utilBuildChatflow function
        logger_1.default.info('========= Start of createAndStreamInternalPrediction utilBuildChatflow - passing in appId, orgId, and userId (from packages/server/src/controllers/internal-predictions/index.ts)=========');
        const apiResponse = await (0, buildChatflow_1.utilBuildChatflow)(req, true);
        sseStreamer.streamMetadataEvent(apiResponse.chatId, apiResponse);
    }
    catch (error) {
        if (chatId) {
            sseStreamer.streamErrorEvent(chatId, (0, utils_1.getErrorMessage)(error));
        }
        next(error);
    }
    finally {
        sseStreamer.removeClient(chatId);
    }
};
exports.default = {
    createInternalPrediction
};
//# sourceMappingURL=index.js.map