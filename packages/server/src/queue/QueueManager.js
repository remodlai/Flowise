"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const PredictionQueue_1 = require("./PredictionQueue");
const UpsertQueue_1 = require("./UpsertQueue");
const bullmq_1 = require("bullmq");
const bull_board_1 = require("bull-board");
const bullMQAdapter_1 = require("bull-board/bullMQAdapter");
const QUEUE_NAME = process.env.QUEUE_NAME || 'flowise-queue';
class QueueManager {
    constructor() {
        this.queues = new Map();
        let tlsOpts = undefined;
        if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
            tlsOpts = {
                rejectUnauthorized: false
            };
        }
        else if (process.env.REDIS_TLS === 'true') {
            tlsOpts = {
                cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
            };
        }
        this.connection = {
            url: process.env.REDIS_URL || undefined,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            username: process.env.REDIS_USERNAME || undefined,
            password: process.env.REDIS_PASSWORD || undefined,
            tls: tlsOpts
        };
    }
    static getInstance() {
        if (!QueueManager.instance) {
            QueueManager.instance = new QueueManager();
        }
        return QueueManager.instance;
    }
    registerQueue(name, queue) {
        this.queues.set(name, queue);
    }
    getConnection() {
        return this.connection;
    }
    getQueue(name) {
        const queue = this.queues.get(name);
        if (!queue)
            throw new Error(`Queue ${name} not found`);
        return queue;
    }
    getPredictionQueueEventsProducer() {
        if (!this.predictionQueueEventsProducer)
            throw new Error('Prediction queue events producer not found');
        return this.predictionQueueEventsProducer;
    }
    getBullBoardRouter() {
        if (!this.bullBoardRouter)
            throw new Error('BullBoard router not found');
        return this.bullBoardRouter;
    }
    async getAllJobCounts() {
        const counts = {};
        for (const [name, queue] of this.queues) {
            counts[name] = await queue.getJobCounts();
        }
        return counts;
    }
    setupAllQueues({ componentNodes, telemetry, cachePool, appDataSource, abortControllerPool }) {
        const predictionQueueName = `${QUEUE_NAME}-prediction`;
        const predictionQueue = new PredictionQueue_1.PredictionQueue(predictionQueueName, this.connection, {
            componentNodes,
            telemetry,
            cachePool,
            appDataSource,
            abortControllerPool
        });
        this.registerQueue('prediction', predictionQueue);
        this.predictionQueueEventsProducer = new bullmq_1.QueueEventsProducer(predictionQueue.getQueueName(), {
            connection: this.connection
        });
        const upsertionQueueName = `${QUEUE_NAME}-upsertion`;
        const upsertionQueue = new UpsertQueue_1.UpsertQueue(upsertionQueueName, this.connection, {
            componentNodes,
            telemetry,
            cachePool,
            appDataSource
        });
        this.registerQueue('upsert', upsertionQueue);
        const bullboard = (0, bull_board_1.createBullBoard)([new bullMQAdapter_1.BullMQAdapter(predictionQueue.getQueue()), new bullMQAdapter_1.BullMQAdapter(upsertionQueue.getQueue())]);
        this.bullBoardRouter = bullboard.router;
    }
}
exports.QueueManager = QueueManager;
//# sourceMappingURL=QueueManager.js.map