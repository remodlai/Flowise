import { RunnableConfig } from '@langchain/core/runnables'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ICommonObject, INodeData, ISeqAgentsState, IServerSideEventStreamer } from '../../../../src/Interface'
import { MessageContentImageUrl, AIMessage } from '@langchain/core/messages'
import { Generation } from '@langchain/core/outputs'

export interface IStreamParams {
    chatId: string;
    shouldStreamResponse?: boolean;
    sseStreamer?: IServerSideEventStreamer;
    isConnectedToEnd?: boolean;
}

export interface IStreamConfig extends Omit<RunnableConfig, 'configurable'> {
    configurable?: {
        thread_id?: string;
        shouldStreamResponse?: boolean;
        isConnectedToEnd?: boolean;
        nodeId?: string;
    } & Record<string, any>;
    streamMode?: string;
    version?: string;
}

export interface IAgentParams {
    state: ISeqAgentsState;
    llm: BaseChatModel;
    agent: any;
    name: string;
    nodeData: INodeData;
    options: ICommonObject;
    interrupt?: boolean;
    multiModalMessageContent?: MessageContentImageUrl[];
    isConnectedToEnd?: boolean;
}

export interface IAgentEvent {
    event: 'on_llm_stream';
    data: {
        chunk: string;
    };
}
