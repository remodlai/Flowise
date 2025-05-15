# Endpoint Analysis: GET /api/v1/internal-chat-messages/{id}

**Module:** `internal-chat-messages`

**Operation ID:** `internalChatMessagesGetAllInternal`

**Description:** Retrieves internal chat messages for a given `chatflowid` (passed as path param `:id`). This is a specialized version of the general `getAllChatMessages` endpoint, specifically filtering for `chatType = INTERNAL`. It retrieves chat messages related to backend processing rather than user interactions.

**Key Files:**
* Router: `routes/internal-chat-messages/index.ts`
* Controller: `controllers/chat-messages/index.ts` (Handler: `getAllInternalChatMessages`)
* Service: `services/chat-messages/index.ts` (Method: `getAllInternalChatMessages`)
* Utility: `utils/getChatMessage.ts` (`utilGetChatMessage`)
* Entities: `ChatMessage.ts`, `ChatMessageFeedback.ts`

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, optional): Chatflow ID. Used to filter messages by chatflow.

**Request Parameters (Query):**
*   `order` (string, enum: ["ASC", "DESC"], default: "ASC"): Sort order for results by creation date.
*   `chatId` (string, optional): Filter by chat ID.
*   `memoryType` (string, optional): Filter by memory type used.
*   `sessionId` (string, optional): Filter by session ID.
*   `messageId` (string, optional): Filter by specific message ID.
*   `startDate` (string, format: date-time, optional): Filter messages created on or after this date.
*   `endDate` (string, format: date-time, optional): Filter messages created on or before this date.
*   `feedback` (boolean, optional): When true, includes feedback data by joining with the ChatMessageFeedback table.
*   `feedbackType` (array of string, enum: ["THUMBS_UP", "THUMBS_DOWN"], optional): Filter by specific feedback rating types.

**Responses:**
*   **`200 OK`:** Returns array of `ChatMessage` entities (filtered for `chatType = INTERNAL`). All stringified JSON fields are automatically parsed into objects/arrays, including:
    - `sourceDocuments`: Array of source document references
    - `usedTools`: Array of tool usage details
    - `fileAnnotations`: Any file annotations
    - `agentReasoning`: Agent reasoning data
    - `fileUploads`: Any uploaded files
    - `artifacts`: Any generated artifacts
    - `action`: Any actions associated with the message
*   **`412 Precondition Failed`:** If `id` (chatflowId) is missing and required by implementation.
*   **`500 Internal Server Error`:** For any server-side processing errors.
