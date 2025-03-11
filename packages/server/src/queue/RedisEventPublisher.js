"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventPublisher = void 0;
const redis_1 = require("redis");
class RedisEventPublisher {
    constructor() {
        if (process.env.REDIS_URL) {
            this.redisPublisher = (0, redis_1.createClient)({
                url: process.env.REDIS_URL
            });
        }
        else {
            this.redisPublisher = (0, redis_1.createClient)({
                username: process.env.REDIS_USERNAME || undefined,
                password: process.env.REDIS_PASSWORD || undefined,
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    tls: process.env.REDIS_TLS === 'true',
                    cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                    key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                    ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
                }
            });
        }
    }
    async connect() {
        await this.redisPublisher.connect();
    }
    streamCustomEvent(chatId, eventType, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType,
                data
            }));
        }
        catch (error) {
            console.error('Error streaming custom event:', error);
        }
    }
    streamStartEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'start',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming start event:', error);
        }
    }
    streamTokenEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'token',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming token event:', error);
        }
    }
    streamSourceDocumentsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'sourceDocuments',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming sourceDocuments event:', error);
        }
    }
    streamArtifactsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'artifacts',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming artifacts event:', error);
        }
    }
    streamUsedToolsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'usedTools',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming usedTools event:', error);
        }
    }
    streamFileAnnotationsEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'fileAnnotations',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming fileAnnotations event:', error);
        }
    }
    streamToolEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'tool',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming tool event:', error);
        }
    }
    streamAgentReasoningEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'agentReasoning',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming agentReasoning event:', error);
        }
    }
    streamNextAgentEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'nextAgent',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming nextAgent event:', error);
        }
    }
    streamActionEvent(chatId, data) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'action',
                data
            }));
        }
        catch (error) {
            console.error('Error streaming action event:', error);
        }
    }
    streamAbortEvent(chatId) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'abort',
                data: '[DONE]'
            }));
        }
        catch (error) {
            console.error('Error streaming abort event:', error);
        }
    }
    streamEndEvent(_) {
        // placeholder for future use
    }
    streamErrorEvent(chatId, msg) {
        try {
            this.redisPublisher.publish(chatId, JSON.stringify({
                chatId,
                eventType: 'error',
                data: msg
            }));
        }
        catch (error) {
            console.error('Error streaming error event:', error);
        }
    }
    streamMetadataEvent(chatId, apiResponse) {
        try {
            const metadataJson = {};
            if (apiResponse.chatId) {
                metadataJson['chatId'] = apiResponse.chatId;
            }
            if (apiResponse.chatMessageId) {
                metadataJson['chatMessageId'] = apiResponse.chatMessageId;
            }
            if (apiResponse.question) {
                metadataJson['question'] = apiResponse.question;
            }
            if (apiResponse.sessionId) {
                metadataJson['sessionId'] = apiResponse.sessionId;
            }
            if (apiResponse.memoryType) {
                metadataJson['memoryType'] = apiResponse.memoryType;
            }
            if (Object.keys(metadataJson).length > 0) {
                this.streamCustomEvent(chatId, 'metadata', metadataJson);
            }
        }
        catch (error) {
            console.error('Error streaming metadata event:', error);
        }
    }
    async disconnect() {
        if (this.redisPublisher) {
            await this.redisPublisher.quit();
        }
    }
}
exports.RedisEventPublisher = RedisEventPublisher;
//# sourceMappingURL=RedisEventPublisher.js.map