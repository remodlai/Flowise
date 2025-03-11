"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionQueue = void 0;
const buildChatflow_1 = require("../utils/buildChatflow");
const RedisEventPublisher_1 = require("./RedisEventPublisher");
const BaseQueue_1 = require("./BaseQueue");
class PredictionQueue extends BaseQueue_1.BaseQueue {
    constructor(name, connection, options) {
        super(name, connection);
        this.queueName = name;
        this.componentNodes = options.componentNodes || {};
        this.telemetry = options.telemetry;
        this.cachePool = options.cachePool;
        this.appDataSource = options.appDataSource;
        this.abortControllerPool = options.abortControllerPool;
        this.redisPublisher = new RedisEventPublisher_1.RedisEventPublisher();
        this.redisPublisher.connect();
    }
    getQueueName() {
        return this.queueName;
    }
    getQueue() {
        return this.queue;
    }
    async processJob(data) {
        if (this.appDataSource)
            data.appDataSource = this.appDataSource;
        if (this.telemetry)
            data.telemetry = this.telemetry;
        if (this.cachePool)
            data.cachePool = this.cachePool;
        if (this.componentNodes)
            data.componentNodes = this.componentNodes;
        if (this.redisPublisher)
            data.sseStreamer = this.redisPublisher;
        if (this.abortControllerPool) {
            const abortControllerId = `${data.chatflow.id}_${data.chatId}`;
            const signal = new AbortController();
            this.abortControllerPool.add(abortControllerId, signal);
            data.signal = signal;
        }
        return await (0, buildChatflow_1.executeFlow)(data);
    }
}
exports.PredictionQueue = PredictionQueue;
//# sourceMappingURL=PredictionQueue.js.map