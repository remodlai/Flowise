import { BaseMessage } from '@langchain/core/messages'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { RunnableConfig } from '@langchain/core/runnables'
import { IServerSideEventStreamer } from '../../../../src/Interface'

export interface IStreamConfig extends RunnableConfig {
    configurable: {
        thread_id?: string;
        shouldStreamResponse?: boolean;
        isConnectedToEnd?: boolean;
        nodeId?: string;
    };
    callbacks?: BaseCallbackHandler[];
    version?: "v1" | "v2";  // Only v1 and v2 are supported
    streamMode?: "values";  // Values mode for streaming
}

export interface IStreamParams {
    chatId: string;
    shouldStreamResponse: boolean;
    sseStreamer: IServerSideEventStreamer;
    isConnectedToEnd?: boolean;  // Keep optional but handle properly in implementation
}

export interface IAgentParams {
    state: {
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[];
            default: () => BaseMessage[];
        };
    };
    llm: any;
    agent: any;
    name: string;
    nodeData: any;
    options: any;
    interrupt?: boolean;
    multiModalMessageContent?: any[];
    isConnectedToEnd?: boolean;
}
