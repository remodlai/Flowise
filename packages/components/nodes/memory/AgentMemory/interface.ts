import { Checkpoint, CheckpointMetadata, CheckpointTuple as LangGraphCheckpointTuple, CheckpointListOptions as LangGraphCheckpointListOptions } from '@langchain/langgraph-checkpoint'
import { RunnableConfig } from '@langchain/core/runnables'
import { IDatabaseEntity } from '../../../src'
import { DataSource } from 'typeorm'

export type SaverOptions = {
    datasourceOptions: any
    threadId: string
    appDataSource: DataSource
    databaseEntities: IDatabaseEntity
    chatflowid: string
}

// Re-export the types from langgraph-checkpoint
export type { LangGraphCheckpointTuple as CheckpointTuple, LangGraphCheckpointListOptions as CheckpointListOptions }

export interface SerializerProtocol<D> {
    dumpsTyped(obj: D): Promise<string>
    loadsTyped(data: string): Promise<D>
}
