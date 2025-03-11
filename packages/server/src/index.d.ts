// import './register-alias';
import express from 'express';
import { DataSource } from 'typeorm';
import { NodesPool } from './NodesPool';
import { CachePool } from './CachePool';
import { AbortControllerPool } from './AbortControllerPool';
import { RateLimiterManager } from './utils/rateLimit';
import { Telemetry } from './utils/telemetry';
import { SSEStreamer } from './utils/SSEStreamer';
import { IMetricsProvider } from './Interface.Metrics';
import { QueueManager } from './queue/QueueManager';
import { RedisEventSubscriber } from './queue/RedisEventSubscriber';
import 'global-agent/bootstrap';
import { IUser } from './Interface';
import { SupabaseClient } from '@supabase/supabase-js';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            tenants?: any[];
            roles?: any[];
            permissions?: any[];
        }
    }
}
declare global {
    namespace Express {
        namespace Multer {
            interface File {
                bucket: string;
                key: string;
                acl: string;
                contentType: string;
                contentDisposition: null;
                storageClass: string;
                serverSideEncryption: null;
                metadata: any;
                location: string;
                etag: string;
            }
        }
    }
}
export declare class App {
    app: express.Application;
    nodesPool: NodesPool;
    abortControllerPool: AbortControllerPool;
    cachePool: CachePool;
    telemetry: Telemetry;
    rateLimiterManager: RateLimiterManager;
    AppDataSource: DataSource;
    sseStreamer: SSEStreamer;
    metricsProvider: IMetricsProvider;
    queueManager: QueueManager;
    redisSubscriber: RedisEventSubscriber;
    Supabase: SupabaseClient | null;
    constructor();
    initDatabase(): Promise<void>;
    initSupabase(): Promise<void>;
    getSupabaseClient(): SupabaseClient;
    config(): Promise<void>;
    stopApp(): Promise<void>;
}
export declare function start(): Promise<void>;
export declare function getInstance(): App | undefined;
