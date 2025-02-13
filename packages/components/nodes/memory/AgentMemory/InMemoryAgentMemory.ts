import { MemorySaver, CheckpointMetadata, SerializerProtocol } from '@langchain/langgraph-checkpoint';
import { RunnableConfig } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { IMessage, AgentMemoryMethods, ICommonObject } from '../../../src/Interface';

// Updated default serializer using JSON that returns a tuple [string, Uint8Array] and takes one argument
const defaultSerializer: SerializerProtocol = {
  dumpsTyped: <T>(obj: T): [string, Uint8Array] => {
    const str = JSON.stringify(obj);
    const encoder = new TextEncoder();
    return [str, encoder.encode(str)];
  },
  loadsTyped: <T>(data: string | Uint8Array): T => {
    let str: string;
    if (typeof data === 'string') {
      str = data;
    } else {
      const decoder = new TextDecoder();
      str = decoder.decode(data);
    }
    return JSON.parse(str);
  }
};

export class InMemoryAgentMemory implements AgentMemoryMethods {
  private memorySaver: MemorySaver;
  private threadId: string;
  private overrideConfig: ICommonObject;

  constructor(threadId: string, overrideConfig?: ICommonObject) {
    this.threadId = threadId;
    this.overrideConfig = overrideConfig || {};
    this.memorySaver = new MemorySaver(defaultSerializer);
  }

  async getChatMessages(
    overrideSessionId: string = '',
    returnBaseMessages: boolean = false,
    prependMessages?: IMessage[]
  ): Promise<IMessage[] | BaseMessage[]> {
    const sessionId = overrideSessionId || this.threadId;
    const config: RunnableConfig = { configurable: { thread_id: sessionId, ...this.overrideConfig } };
    return this.memorySaver.getTuple(config).then(async (tuple) => {
      if (!tuple || !tuple.checkpoint) {
        return prependMessages || [];
      }
      // Cast messages to the expected type
      const messages = (tuple.checkpoint.channel_values?.messages || []) as IMessage[];
      return messages;
    });
  }

  async addChatMessages(
    msgArray: { text: string; type: string }[],
    overrideSessionId: string = ''
  ): Promise<void> {
    const sessionId = overrideSessionId || this.threadId;
    const config: RunnableConfig = { configurable: { thread_id: sessionId, ...this.overrideConfig } };
    let currentState: any = {};
    const tuple = await this.memorySaver.getTuple(config);
    if (tuple && tuple.checkpoint && tuple.checkpoint.channel_values) {
      currentState = tuple.checkpoint.channel_values;
    }
    const oldMessages = currentState.messages || [];
    const newMessages = [...oldMessages, ...msgArray];
    currentState.messages = newMessages;
    await this.updateState(currentState);
  }

  async clearChatMessages(overrideSessionId: string = ''): Promise<void> {
    // Clear messages by updating state with empty messages array
    await this.updateState({ messages: [] });
  }

  async getState(): Promise<any> {
    const config: RunnableConfig = { configurable: { thread_id: this.threadId, ...this.overrideConfig } };
    const tuple = await this.memorySaver.getTuple(config);
    return tuple && tuple.checkpoint && tuple.checkpoint.channel_values ? tuple.checkpoint.channel_values : {};
  }

  async updateState(newState: any): Promise<void> {
    const config: RunnableConfig = { configurable: { thread_id: this.threadId, ...this.overrideConfig } };
    const currentState = await this.getState();
    const mergedState = { ...currentState, ...newState };
    const checkpoint = {
      v: 1,
      id: (config.configurable && config.configurable.checkpoint_id) || '',
      ts: new Date().toISOString(),
      channel_values: mergedState,
      channel_versions: {},
      versions_seen: {},
      pending_sends: []
    };
    // Cast source as a literal type 'update'
    const metadata: CheckpointMetadata = { source: 'update' as 'update', step: 0, writes: null, parents: {} };
    await this.memorySaver.put(config, checkpoint, metadata);
  }
} 