"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utilGetChatMessage = void 0;
const typeorm_1 = require("typeorm");
const ChatMessage_1 = require("../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../database/entities/ChatMessageFeedback");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const _1 = require(".");
const utilGetChatMessage = async ({ chatflowid, chatTypes, sortOrder = 'ASC', chatId, memoryType, sessionId, startDate, endDate, messageId, feedback, feedbackTypes }) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    if (feedback) {
        const query = await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).createQueryBuilder('chat_message');
        // do the join with chat message feedback based on messageId for each chat message in the chatflow
        query
            .leftJoinAndMapOne('chat_message.feedback', ChatMessageFeedback_1.ChatMessageFeedback, 'feedback', 'feedback.messageId = chat_message.id')
            .where('chat_message.chatflowid = :chatflowid', { chatflowid });
        // based on which parameters are available add `andWhere` clauses to the query
        if (chatTypes && chatTypes.length > 0) {
            query.andWhere('chat_message.chatType IN (:...chatTypes)', { chatTypes });
        }
        if (chatId) {
            query.andWhere('chat_message.chatId = :chatId', { chatId });
        }
        if (memoryType) {
            query.andWhere('chat_message.memoryType = :memoryType', { memoryType });
        }
        if (sessionId) {
            query.andWhere('chat_message.sessionId = :sessionId', { sessionId });
        }
        // set date range
        if (startDate) {
            query.andWhere('chat_message.createdDate >= :startDateTime', { startDateTime: startDate ? new Date(startDate) : (0, _1.aMonthAgo)() });
        }
        if (endDate) {
            query.andWhere('chat_message.createdDate <= :endDateTime', { endDateTime: endDate ? new Date(endDate) : new Date() });
        }
        // sort
        query.orderBy('chat_message.createdDate', sortOrder === 'DESC' ? 'DESC' : 'ASC');
        const messages = (await query.getMany());
        if (feedbackTypes && feedbackTypes.length > 0) {
            // just applying a filter to the messages array will only return the messages that have feedback,
            // but we also want the message before the feedback message which is the user message.
            const indicesToKeep = new Set();
            messages.forEach((message, index) => {
                if (message.role === 'apiMessage' && message.feedback && feedbackTypes.includes(message.feedback.rating)) {
                    if (index > 0)
                        indicesToKeep.add(index - 1);
                    indicesToKeep.add(index);
                }
            });
            return messages.filter((_, index) => indicesToKeep.has(index));
        }
        return messages;
    }
    let createdDateQuery;
    if (startDate || endDate) {
        if (startDate && endDate) {
            createdDateQuery = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
        }
        else if (startDate) {
            createdDateQuery = (0, typeorm_1.MoreThanOrEqual)(new Date(startDate));
        }
        else if (endDate) {
            createdDateQuery = (0, typeorm_1.LessThanOrEqual)(new Date(endDate));
        }
    }
    return await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).find({
        where: {
            chatflowid,
            chatType: chatTypes?.length ? (0, typeorm_1.In)(chatTypes) : undefined,
            chatId,
            memoryType: memoryType ?? undefined,
            sessionId: sessionId ?? undefined,
            createdDate: createdDateQuery,
            id: messageId ?? undefined
        },
        order: {
            createdDate: sortOrder === 'DESC' ? 'DESC' : 'ASC'
        }
    });
};
exports.utilGetChatMessage = utilGetChatMessage;
//# sourceMappingURL=getChatMessage.js.map