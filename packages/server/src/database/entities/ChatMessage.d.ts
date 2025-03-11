import { IChatMessage, MessageType } from '../../Interface';
export declare class ChatMessage implements IChatMessage {
    id: string;
    role: MessageType;
    chatflowid: string;
    content: string;
    sourceDocuments?: string;
    usedTools?: string;
    fileAnnotations?: string;
    agentReasoning?: string;
    fileUploads?: string;
    artifacts?: string;
    action?: string | null;
    chatType: string;
    chatId: string;
    memoryType?: string;
    sessionId?: string;
    createdDate: Date;
    leadEmail?: string;
    followUpPrompts?: string;
}
