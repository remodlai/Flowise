# Endpoint Analysis: GET /api/v1/internal-chat-messages/{id}

**Module:** `internal-chat-messages`
**Operation ID:** `internalChatMessagesGetAllInternal`
**Description:** Retrieves internal chat messages for a given `chatflowid` (passed as path param `:id`). This is a specialized version of the general `getAllChatMessages` endpoint, specifically filtering for `chatType = INTERNAL`.

**Key Files:**
* Router: `routes/internal-chat-messages/index.ts`
* Controller: `controllers/chat-messages/index.ts` (Handler: `getAllInternalChatMessages`)
* Service: `services/chat-messages/index.ts` (Method: `getAllInternalChatMessages`)
* Utility: `utils/getChatMessage.ts` (`utilGetChatMessage`)
* Entities: `ChatMessage.ts`, `ChatMessageFeedback.ts`

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, required): Chatflow ID.
**Request Parameters (Query - same as `getAllChatMessages` but `chatType` is ignored/overridden):**
*   `order?`, `chatId?`, `memoryType?`, `sessionId?`, `messageId?`, `startDate?`, `endDate?`, `feedback?`, `feedbackType?`

**Responses:**
*   **`200 OK`:** Returns array of `ChatMessage` entities (filtered for `chatType = INTERNAL`), parsed.
*   **`412 Precondition Failed`:** If `id` (chatflowId) is missing.
*   **`500 Internal Server Error`**
