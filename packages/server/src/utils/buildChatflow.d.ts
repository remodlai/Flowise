import { Request } from 'express';
import { IExecuteFlowParams } from '../Interface';
export declare const executeFlow: ({ componentNodes, incomingInput, chatflow, chatId, appDataSource, telemetry, cachePool, sseStreamer, baseURL, isInternal, files, signal }: IExecuteFlowParams) => Promise<any>;
/**
 * Build/Data Preperation for execute function
 * @param {Request} req
 * @param {boolean} isInternal
 */
export declare const utilBuildChatflow: (req: Request, isInternal?: boolean) => Promise<any>;
