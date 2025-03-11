"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEStreamer = void 0;
class SSEStreamer {
    constructor() {
        this.clients = {};
    }
    addExternalClient(chatId, res) {
        this.clients[chatId] = { clientType: 'EXTERNAL', response: res, started: false };
    }
    addClient(chatId, res) {
        this.clients[chatId] = { clientType: 'INTERNAL', response: res, started: false };
    }
    removeClient(chatId) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'end',
                data: '[DONE]'
            };
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            client.response.end();
            delete this.clients[chatId];
        }
    }
    streamCustomEvent(chatId, eventType, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: eventType,
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamStartEvent(chatId, data) {
        const client = this.clients[chatId];
        // prevent multiple start events being streamed to the client
        if (client && !client.started) {
            const clientResponse = {
                event: 'start',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
            client.started = true;
        }
    }
    streamTokenEvent(chatId, data, type) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'token',
                data: data,
                type: type || ''
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamSourceDocumentsEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'sourceDocuments',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamArtifactsEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'artifacts',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamUsedToolsEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'usedTools',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamFileAnnotationsEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'fileAnnotations',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamToolEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'tool',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamAgentReasoningEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'agentReasoning',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamNextAgentEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'nextAgent',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamActionEvent(chatId, data) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'action',
                data: data
            };
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamAbortEvent(chatId) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'abort',
                data: '[DONE]'
            };
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamEndEvent(_) {
        // placeholder for future use
    }
    streamErrorEvent(chatId, msg) {
        const client = this.clients[chatId];
        if (client) {
            const clientResponse = {
                event: 'error',
                data: msg
            };
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n');
        }
    }
    streamMetadataEvent(chatId, apiResponse) {
        const metadataJson = {};
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
            metadataJson['followUpPrompts'] = JSON.parse(apiResponse.followUpPrompts);
        }
        if (Object.keys(metadataJson).length > 0) {
            this.streamCustomEvent(chatId, 'metadata', metadataJson);
        }
    }
}
exports.SSEStreamer = SSEStreamer;
//# sourceMappingURL=SSEStreamer.js.map