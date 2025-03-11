import { DataSource } from 'typeorm';
import { IComponentNodes, IExecuteFlowParams } from '../Interface';
import { Telemetry } from '../utils/telemetry';
import { CachePool } from '../CachePool';
import { AbortControllerPool } from '../AbortControllerPool';
import { BaseQueue } from './BaseQueue';
import { RedisOptions } from 'bullmq';
interface PredictionQueueOptions {
    appDataSource: DataSource;
    telemetry: Telemetry;
    cachePool: CachePool;
    componentNodes: IComponentNodes;
    abortControllerPool: AbortControllerPool;
}
export declare class PredictionQueue extends BaseQueue {
    private componentNodes;
    private telemetry;
    private cachePool;
    private appDataSource;
    private abortControllerPool;
    private redisPublisher;
    private queueName;
    constructor(name: string, connection: RedisOptions, options: PredictionQueueOptions);
    getQueueName(): string;
    getQueue(): import("bullmq").Queue<any, any, string, any, any, string>;
    processJob(data: IExecuteFlowParams): Promise<any>;
}
export {};
