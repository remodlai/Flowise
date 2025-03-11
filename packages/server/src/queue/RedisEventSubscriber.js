"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventSubscriber = void 0;
const redis_1 = require("redis");
class RedisEventSubscriber {
    constructor(sseStreamer) {
        this.subscribedChannels = new Set();
        if (process.env.REDIS_URL) {
            this.redisSubscriber = (0, redis_1.createClient)({
                url: process.env.REDIS_URL
            });
        }
        else {
            this.redisSubscriber = (0, redis_1.createClient)({
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
        this.sseStreamer = sseStreamer;
    }
    async connect() {
        await this.redisSubscriber.connect();
    }
    subscribe(channel) {
        // Subscribe to the Redis channel for job events
        if (!this.redisSubscriber) {
            throw new Error('Redis subscriber not connected.');
        }
        // Check if already subscribed
        if (this.subscribedChannels.has(channel)) {
            return; // Prevent duplicate subscription
        }
        this.redisSubscriber.subscribe(channel, (message) => {
            this.handleEvent(message);
        });
        // Mark the channel as subscribed
        this.subscribedChannels.add(channel);
    }
    handleEvent(message) {
        // Parse the message from Redis
        const event = JSON.parse(message);
        const { eventType, chatId, data } = event;
        // Stream the event to the client
        switch (eventType) {
            case 'start':
                this.sseStreamer.streamStartEvent(chatId, data);
                break;
            case 'token':
                this.sseStreamer.streamTokenEvent(chatId, data);
                break;
            case 'sourceDocuments':
                this.sseStreamer.streamSourceDocumentsEvent(chatId, data);
                break;
            case 'artifacts':
                this.sseStreamer.streamArtifactsEvent(chatId, data);
                break;
            case 'usedTools':
                this.sseStreamer.streamUsedToolsEvent(chatId, data);
                break;
            case 'fileAnnotations':
                this.sseStreamer.streamFileAnnotationsEvent(chatId, data);
                break;
            case 'tool':
                this.sseStreamer.streamToolEvent(chatId, data);
                break;
            case 'agentReasoning':
                this.sseStreamer.streamAgentReasoningEvent(chatId, data);
                break;
            case 'nextAgent':
                this.sseStreamer.streamNextAgentEvent(chatId, data);
                break;
            case 'action':
                this.sseStreamer.streamActionEvent(chatId, data);
                break;
            case 'abort':
                this.sseStreamer.streamAbortEvent(chatId);
                break;
            case 'error':
                this.sseStreamer.streamErrorEvent(chatId, data);
                break;
            case 'metadata':
                this.sseStreamer.streamMetadataEvent(chatId, data);
                break;
        }
    }
    async disconnect() {
        if (this.redisSubscriber) {
            await this.redisSubscriber.quit();
        }
    }
}
exports.RedisEventSubscriber = RedisEventSubscriber;
//# sourceMappingURL=RedisEventSubscriber.js.map