import { Response } from 'express';
import { IServerSideEventStreamer } from 'flowise-components';
type Client = {
    clientType: 'INTERNAL' | 'EXTERNAL';
    response: Response;
    started?: boolean;
};
export declare class SSEStreamer implements IServerSideEventStreamer {
    clients: {
        [id: string]: Client;
    };
    addExternalClient(chatId: string, res: Response): void;
    addClient(chatId: string, res: Response): void;
    removeClient(chatId: string): void;
    streamCustomEvent(chatId: string, eventType: string, data: any): void;
    streamStartEvent(chatId: string, data: string): void;
    streamTokenEvent(chatId: string, data: string, type?: string): void;
    streamSourceDocumentsEvent(chatId: string, data: any): void;
    streamArtifactsEvent(chatId: string, data: any): void;
    streamUsedToolsEvent(chatId: string, data: any): void;
    streamFileAnnotationsEvent(chatId: string, data: any): void;
    streamToolEvent(chatId: string, data: any): void;
    streamAgentReasoningEvent(chatId: string, data: any): void;
    streamNextAgentEvent(chatId: string, data: any): void;
    streamActionEvent(chatId: string, data: any): void;
    streamAbortEvent(chatId: string): void;
    streamEndEvent(_: string): void;
    streamErrorEvent(chatId: string, msg: string): void;
    streamMetadataEvent(chatId: string, apiResponse: any): void;
}
export {};
