"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseQueue = void 0;
const bullmq_1 = require("bullmq");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
const QUEUE_REDIS_EVENT_STREAM_MAX_LEN = process.env.QUEUE_REDIS_EVENT_STREAM_MAX_LEN
    ? parseInt(process.env.QUEUE_REDIS_EVENT_STREAM_MAX_LEN)
    : 10000;
const WORKER_CONCURRENCY = process.env.WORKER_CONCURRENCY ? parseInt(process.env.WORKER_CONCURRENCY) : 100000;
class BaseQueue {
    constructor(queueName, connection) {
        this.connection = connection;
        this.queue = new bullmq_1.Queue(queueName, {
            connection: this.connection,
            streams: { events: { maxLen: QUEUE_REDIS_EVENT_STREAM_MAX_LEN } }
        });
        this.queueEvents = new bullmq_1.QueueEvents(queueName, { connection: this.connection });
    }
    getWorker() {
        return this.worker;
    }
    async addJob(jobData) {
        const jobId = jobData.id || (0, uuid_1.v4)();
        return await this.queue.add(jobId, jobData, { removeOnFail: true });
    }
    createWorker(concurrency = WORKER_CONCURRENCY) {
        this.worker = new bullmq_1.Worker(this.queue.name, async (job) => {
            const start = new Date().getTime();
            logger_1.default.info(`Processing job ${job.id} in ${this.queue.name} at ${new Date().toISOString()}`);
            const result = await this.processJob(job.data);
            const end = new Date().getTime();
            logger_1.default.info(`Completed job ${job.id} in ${this.queue.name} at ${new Date().toISOString()} (${end - start}ms)`);
            return result;
        }, {
            connection: this.connection,
            concurrency
        });
        return this.worker;
    }
    async getJobs() {
        return await this.queue.getJobs();
    }
    async getJobCounts() {
        return await this.queue.getJobCounts();
    }
    async getJobByName(jobName) {
        const jobs = await this.queue.getJobs();
        const job = jobs.find((job) => job.name === jobName);
        if (!job)
            throw new Error(`Job name ${jobName} not found`);
        return job;
    }
    getQueueEvents() {
        return this.queueEvents;
    }
    async clearQueue() {
        await this.queue.obliterate({ force: true });
    }
}
exports.BaseQueue = BaseQueue;
//# sourceMappingURL=BaseQueue.js.map