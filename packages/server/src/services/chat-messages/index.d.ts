import { DeleteResult, FindOptionsWhere } from 'typeorm';
import { ChatMessageRatingType, ChatType, IChatMessage } from '../../Interface';
import { ChatMessage } from '../../database/entities/ChatMessage';
declare const _default: {
    createChatMessage: (chatMessage: Partial<IChatMessage>) => Promise<ChatMessage>;
    getAllChatMessages: (chatflowId: string, chatTypes: ChatType[] | undefined, sortOrder?: string, chatId?: string, memoryType?: string, sessionId?: string, startDate?: string, endDate?: string, messageId?: string, feedback?: boolean, feedbackTypes?: ChatMessageRatingType[]) => Promise<ChatMessage[]>;
    getAllInternalChatMessages: (chatflowId: string, chatTypes: ChatType[] | undefined, sortOrder?: string, chatId?: string, memoryType?: string, sessionId?: string, startDate?: string, endDate?: string, messageId?: string, feedback?: boolean, feedbackTypes?: ChatMessageRatingType[]) => Promise<ChatMessage[]>;
    removeAllChatMessages: (chatId: string, chatflowid: string, deleteOptions: FindOptionsWhere<ChatMessage>) => Promise<DeleteResult>;
    removeChatMessagesByMessageIds: (chatflowid: string, chatIdMap: Map<string, ChatMessage[]>, messageIds: string[]) => Promise<DeleteResult>;
    abortChatMessage: (chatId: string, chatflowid: string) => Promise<void>;
};
export default _default;
