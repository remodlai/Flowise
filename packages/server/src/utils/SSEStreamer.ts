import { Response } from 'express'
import { IServerSideEventStreamer, IAgentReasoning, TokenEventType } from 'flowise-components'
import logger from './logger'

// Test logger is working
logger.info('SSEStreamer logger test - ' + new Date().toISOString())

// define a new type that has a client type (INTERNAL or EXTERNAL) and Response type
type Client = {
    // future use
    clientType: 'INTERNAL' | 'EXTERNAL'
    response: Response
    // optional property with default value
    started?: boolean
}

export class SSEStreamer implements IServerSideEventStreamer {
    clients: { [id: string]: Client } = {}

    addExternalClient(chatId: string, res: Response) {
        this.clients[chatId] = { clientType: 'EXTERNAL', response: res, started: false }
        logger.info(`[SSEStreamer] Added external client for chatId: ${chatId}`)
    }

    addClient(chatId: string, res: Response) {
        this.clients[chatId] = { clientType: 'INTERNAL', response: res, started: false }
        logger.info(`[SSEStreamer] Added internal client for chatId: ${chatId}`)
    }

    removeClient(chatId: string) {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            try {
                const clientResponse = {
                    event: 'end',
                    data: '[DONE]'
                };
                client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n');
                client.response.end();
                delete this.clients[chatId];
                logger.info(`[SSEStreamer] Successfully removed client for chatId: ${chatId}`);
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to remove client:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in removeClient:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamCustomEvent(chatId: string, eventType: string, data: any) {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: eventType,
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write custom event:', {
                    chatId,
                    eventType,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamCustomEvent:', {
                chatId,
                eventType,
                error: error?.message || String(error)
            });
        }
    }

    streamStartEvent(chatId: string, data: string | IAgentReasoning[]) {
        try {
            const client = this.clients[chatId]
            logger.info(`[SSEStreamer] streamStartEvent called with chatId: ${chatId}`)
            logger.info(`[SSEStreamer] Client exists: ${client ? 'yes' : 'no'}`)
            logger.info(`[SSEStreamer] Client started: ${client?.started}`)
            logger.info(`[SSEStreamer] Raw incoming data:`, data)
            logger.info(`[SSEStreamer] Data type: ${typeof data}`)
            logger.info(`[SSEStreamer] Is array: ${Array.isArray(data)}`)
            
            // Validate client and state
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            // Check if client is already started
            if (client.started) {
                logger.info('[SSEStreamer] Client already started, skipping start event');
                return;
            }

            // Prepare response data
            const clientResponse = {
                event: 'start',
                data: data || null // Ensure data is never undefined
            };

            // Write response with error handling
            try {
                const sseMessage = 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n';
                logger.info(`[SSEStreamer] Final SSE message being sent:`, sseMessage);
                client.response.write(sseMessage);
                client.started = true;
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write start event:', {
                    chatId,
                    error: error?.message || String(error)
                });
                throw error;
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamStartEvent:', {
                chatId,
                error: error?.message || String(error)
            });
            // Don't throw here - let the error be handled by the caller
        }
    }

    streamTokenEvent(chatId: string, data: string, type?: TokenEventType): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            // Validate and trim data
            if (!data || typeof data !== 'string') {
                logger.warn(`[SSEStreamer] Invalid token data for chatId: ${chatId}`);
                return;
            }
            const trimmedData = data.trim();
            if (!trimmedData) {
                logger.debug(`[SSEStreamer] Empty token data for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'token',
                data: trimmedData,
                type: type || TokenEventType.AGENT_REASONING
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write token event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamTokenEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamSourceDocumentsEvent(chatId: string, data: any) {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'sourceDocuments',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write source documents event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamSourceDocumentsEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamArtifactsEvent(chatId: string, data: any) {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'artifacts',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write artifacts event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamArtifactsEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamUsedToolsEvent(chatId: string, data: any): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'usedTools',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write used tools event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamUsedToolsEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamFileAnnotationsEvent(chatId: string, data: any): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'fileAnnotations',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write file annotations event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamFileAnnotationsEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamToolEvent(chatId: string, data: any): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'tool',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write tool event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamToolEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamAgentReasoningEvent(chatId: string, data: any): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'agentReasoning',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write agent reasoning event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamAgentReasoningEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamNextAgentEvent(chatId: string, data: any): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'nextAgent',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write next agent event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamNextAgentEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamActionEvent(chatId: string, data: any): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'action',
                data: data || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write action event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamActionEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamAbortEvent(chatId: string): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'abort',
                data: '[DONE]'
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write abort event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamAbortEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamEndEvent(chatId: string) {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'end',
                data: '[DONE]'
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write end event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamEndEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamErrorEvent(chatId: string, msg: string) {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'error',
                data: msg || 'Unknown error' // Ensure we always have an error message
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write error event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamErrorEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamMetadataEvent(chatId: string, apiResponse: any) {
        try {
            if (!apiResponse) {
                logger.warn(`[SSEStreamer] Invalid API response for chatId: ${chatId}`);
                return;
            }

            const metadataJson: any = {};
            try {
                if (apiResponse.chatId) {
                    metadataJson['chatId'] = apiResponse.chatId;
                }
                if (apiResponse.chatMessageId) {
                    metadataJson['chatMessageId'] = apiResponse.chatMessageId;
                }
                if (apiResponse.question) {
                    metadataJson['question'] = apiResponse.question;
                }
                if (apiResponse.sessionId) {
                    metadataJson['sessionId'] = apiResponse.sessionId;
                }
                if (apiResponse.memoryType) {
                    metadataJson['memoryType'] = apiResponse.memoryType;
                }
                if (apiResponse.followUpPrompts) {
                    try {
                        metadataJson['followUpPrompts'] = JSON.parse(apiResponse.followUpPrompts);
                    } catch (parseError: any) {
                        logger.error('[SSEStreamer] Failed to parse followUpPrompts:', {
                            chatId,
                            error: parseError?.message || String(parseError)
                        });
                        metadataJson['followUpPrompts'] = null;
                    }
                }

                if (Object.keys(metadataJson).length > 0) {
                    this.streamCustomEvent(chatId, 'metadata', metadataJson);
                } else {
                    logger.debug(`[SSEStreamer] No metadata to stream for chatId: ${chatId}`);
                }
            } catch (processingError: any) {
                logger.error('[SSEStreamer] Error processing metadata:', {
                    chatId,
                    error: processingError?.message || String(processingError)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamMetadataEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamAgentReasoningStartEvent(chatId: string, data?: string): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'agentReasoningStart',
                data: data || null
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write agent reasoning start event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamAgentReasoningStartEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamAgentReasoningEndEvent(chatId: string): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'agentReasoningEnd',
                data: null
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write agent reasoning end event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamAgentReasoningEndEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamTokenStartEvent(chatId: string): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'tokenStart',
                data: null
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write token start event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamTokenStartEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamTokenEndEvent(chatId: string): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'tokenEnd',
                data: null
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write token end event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamTokenEndEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }

    streamConditionEvent(chatId: string, condition: string): void {
        try {
            const client = this.clients[chatId]
            if (!client) {
                logger.warn(`[SSEStreamer] No client found for chatId: ${chatId}`);
                return;
            }

            const clientResponse = {
                event: 'condition',
                data: condition || null // Ensure data is never undefined
            };

            try {
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            } catch (error: any) {
                logger.error('[SSEStreamer] Failed to write condition event:', {
                    chatId,
                    error: error?.message || String(error)
                });
            }
        } catch (error: any) {
            logger.error('[SSEStreamer] Error in streamConditionEvent:', {
                chatId,
                error: error?.message || String(error)
            });
        }
    }
}
