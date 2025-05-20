import { ChatMessageFeedback } from '../database/entities/ChatMessageFeedback'
import { IChatMessageFeedback } from '../Interface'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'

/**
 * Method that add chat message feedback.
 * @param {Partial<IChatMessageFeedback>} chatMessageFeedback
 */

export const utilAddChatMessageFeedback = async (chatMessageFeedback: Partial<IChatMessageFeedback>): Promise<ChatMessageFeedback> => {
    const appServer = getRunningExpressApp()
    const newChatMessageFeedback = new ChatMessageFeedback()
    Object.assign(newChatMessageFeedback, chatMessageFeedback)

    // Tactical Fix for new ownership columns:
    if (!newChatMessageFeedback.applicationId) {
        newChatMessageFeedback.applicationId = process.env.DEFAULT_PLATFORM_APP_ID || '3b702f3b-5749-4bae-a62e-fb967921ab80';
    }
    if (newChatMessageFeedback.organizationId === undefined) {
        newChatMessageFeedback.organizationId = null;
    }
    if (newChatMessageFeedback.userId === undefined) {
        newChatMessageFeedback.userId = null;
    }

    const feedback = await appServer.AppDataSource.getRepository(ChatMessageFeedback).create(newChatMessageFeedback)
    return await appServer.AppDataSource.getRepository(ChatMessageFeedback).save(feedback)
}
