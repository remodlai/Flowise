import { 
    Checkpoint, 
    CheckpointMetadata, 
    CheckpointTuple as LangGraphCheckpointTuple, 
    CheckpointListOptions as LangGraphCheckpointListOptions,
    BaseCheckpointSaver,
    ChannelVersions,
    PendingWrite,
    SendProtocol
} from '@langchain/langgraph-checkpoint'
import { RunnableConfig } from '@langchain/core/runnables'
import { IDatabaseEntity } from '../../../src'
import { DataSource } from 'typeorm'
import { BaseMessage } from '@langchain/core/messages'

export type SaverOptions = {
    datasourceOptions: any
    threadId: string
    appDataSource: DataSource
    databaseEntities: IDatabaseEntity
    chatflowid: string
}

// Re-export the types from langgraph-checkpoint
export type { 
    LangGraphCheckpointTuple as CheckpointTuple, 
    LangGraphCheckpointListOptions as CheckpointListOptions 
}

// Define our state structure
export interface StateData {
    messages: BaseMessage[]
    [key: string]: any
}

// Define our checkpoint structure
export interface FlowiseCheckpoint extends Checkpoint {
    channel_values: StateData
}

// Define our serializer protocol
export interface SerializerProtocol<D> {
    dumpsTyped(obj: D): Promise<string>
    loadsTyped(data: string): Promise<D>
}

// Define our memory methods
export interface MemoryMethods {
    getTuple(config: RunnableConfig): Promise<LangGraphCheckpointTuple | undefined>
    putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void>
    put(
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        newVersions: ChannelVersions
    ): Promise<RunnableConfig>
    list(
        config: RunnableConfig,
        options?: LangGraphCheckpointListOptions
    ): AsyncGenerator<LangGraphCheckpointTuple>
    delete(threadId: string): Promise<void>
}
