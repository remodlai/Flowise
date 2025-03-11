import { AnthropicInput, ChatAnthropic as LangchainChatAnthropic } from '@langchain/anthropic'
import { BaseCache } from '@langchain/core/caches'
import { BaseLLMParams } from '@langchain/core/language_models/llms'
import { ICommonObject, IMultiModalOption, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { ChatAnthropic } from './FlowiseChatAnthropic'
import { getModels, MODEL_TYPE } from '../../../src/modelLoader'
import logger from '../../../../server/src/utils/logger'
class ChatAnthropic_ChatModels implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'ChatAnthropic'
        this.name = 'chatAnthropic'
        this.version = 7.0
        this.type = 'ChatAnthropic'
        this.icon = 'Anthropic.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around ChatAnthropic large language models that use the Chat endpoint'
        this.baseClasses = [this.type, ...getBaseClasses(LangchainChatAnthropic)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['anthropicApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'claude-3-haiku'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokensToSample',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Allow Image Uploads',
                name: 'allowImageUploads',
                type: 'boolean',
                description:
                    'Allow image input. Refer to the <a href="https://docs.flowiseai.com/using-flowise/uploads#image" target="_blank">docs</a> for more details.',
                default: false,
                optional: true
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listModels(): Promise<INodeOptionsValue[]> {
            return await getModels(MODEL_TYPE.CHAT, 'chatAnthropic')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const temperature = nodeData.inputs?.temperature as string
        const modelName = nodeData.inputs?.modelName as string
        const maxTokens = nodeData.inputs?.maxTokensToSample as string
        const topP = nodeData.inputs?.topP as string
        const topK = nodeData.inputs?.topK as string
        const streaming = nodeData.inputs?.streaming as boolean
        const cache = nodeData.inputs?.cache as BaseCache
        
        logger.info('========= Start of init for ChatAnthropic =========')
        logger.info(`nodeData.credential: ${nodeData.credential ?? 'none'}`)
        logger.info(`options keys: ${Object.keys(options).join(', ')}`)
        logger.info(`options.appId: ${options.appId ?? 'not present'}`)
        logger.info(`options.orgId: ${options.orgId ?? 'not present'}`)
        logger.info(`options.userId: ${options.userId ?? 'not present'}`)
        
        // Log flowConfig details
        if (options.flowConfig) {
            logger.info(`options.flowConfig keys: ${Object.keys(options.flowConfig).join(', ')}`)
            logger.info(`options.flowConfig.appId: ${options.flowConfig.appId ?? 'not present'}`)
            logger.info(`options.flowConfig.orgId: ${options.flowConfig.orgId ?? 'not present'}`)
            logger.info(`options.flowConfig.userId: ${options.flowConfig.userId ?? 'not present'}`)
        } else {
            logger.info('options.flowConfig is not present')
        }
        
        // Log all options for debugging
        logger.info(`Full options object: ${JSON.stringify(options, null, 2)}`)
        
        try {
            logger.info(`Calling getCredentialData with credential ID: ${nodeData.credential ?? 'none'}`)
            const credentialData = await getCredentialData(nodeData.credential ?? '', options)
            logger.info(`Credential data received: ${JSON.stringify(credentialData, null, 2)}`)
            
            logger.info(`Calling getCredentialParam for anthropicApiKey`)
            const anthropicApiKey = getCredentialParam('anthropicApiKey', credentialData, nodeData)
            logger.info(`anthropicApiKey received: ${anthropicApiKey ? 'API key found (redacted)' : 'API key not found'}`)
            
            const allowImageUploads = nodeData.inputs?.allowImageUploads as boolean

            const obj: Partial<AnthropicInput> & BaseLLMParams & { anthropicApiKey?: string } = {
                temperature: parseFloat(temperature),
                modelName,
                anthropicApiKey,
                streaming: streaming ?? true
            }
            
            logger.info(`Model configuration: ${JSON.stringify({
                temperature: parseFloat(temperature),
                modelName,
                hasApiKey: !!anthropicApiKey,
                streaming: streaming ?? true
            }, null, 2)}`)
            
            if (!anthropicApiKey) {
                logger.error('Anthropic API key is missing or empty')
                throw new Error('Anthropic API key not found')
            }

            if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
            if (topP) obj.topP = parseFloat(topP)
            if (topK) obj.topK = parseFloat(topK)
            if (cache) obj.cache = cache

            const multiModalOption: IMultiModalOption = {
                image: {
                    allowImageUploads: allowImageUploads ?? false
                }
            }

            const model = new ChatAnthropic(nodeData.id, obj)
            model.setMultiModalOption(multiModalOption)
            return model
        } catch (error) {
            logger.error('Error initializing ChatAnthropic:', error)
            throw error
        }
    }
}

module.exports = { nodeClass: ChatAnthropic_ChatModels }