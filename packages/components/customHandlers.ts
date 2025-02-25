import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import {  RemodlBaseCallbackManager, CombinedCallbackManager } from './src/agents'
import { Serialized } from '@langchain/core/load/serializable'
import { ChainValues } from '@langchain/core/utils/types'
import { BaseCallbackManager, CallbackManagerForChainRun } from '@langchain/core/callbacks/manager'

export  class RemodlBaseCallbackHandler extends BaseCallbackHandler {
    name = 'RemodlBaseCallbackHandler';
     GetParentRunId(): string | undefined;
     handleChainStart(chain: Serialized, inputs: ChainValues, _runId?: string, _parentRunId?: string, _tags?: string[], kwargs?: {
        inputs?: Record<string, unknown>;
    }): Promise<CombinedCallbackManager> {
        return new CombinedCallbackManager();
    }
}