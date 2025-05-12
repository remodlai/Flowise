# Endpoint Analysis: DELETE /api/v1/chatmessage/:chatflowid

**Module:** `chat-messages`
**Operation ID:** `internalChatMessagesRemoveAll` (Reflects controller `removeAllChatMessages`)
**Base Path Note:** Singular `/api/v1/chatmessage/`.
**Description:** Deletes chat messages for a given `chatflowid`. Can operate in two main modes based on the presence of `chatId` in query parameters:
1.  **If `chatId` query param is NOT provided:** Deletes messages matching `chatflowid` and other optional filters (session, date range, feedback types). It can also clear associated session memory from third-party integrations if `hardDelete` is true.
2.  **If `chatId` query param IS provided:** Clears session memory for the specific `chatflowid` and `chatId`, then deletes messages matching these and other filters.

This endpoint is for bulk deletion based on criteria, not for deleting a single message by its own ID via the path parameter. The path parameter `:id` corresponds to `chatflowid`.

**Key Files:**
*   **Router:** `packages/server/src/routes/chat-messages/index.ts` (Route `DELETE /:id`, where `:id` is `chatflowid`)
*   **Controller:** `packages/server/src/controllers/chat-messages/index.ts` (Handler: `removeAllChatMessages`)
*   **Service:** `packages/server/src/services/chat-messages/index.ts` (Methods: `removeAllChatMessages`, `removeChatMessagesByMessageIds`)
*   **Entities:** `packages/server/src/database/entities/ChatMessage.ts`, `packages/server/src/database/entities/ChatMessageFeedback.ts`
*   **Utilities:** `../../utils/getChatMessage.ts`, `../../utils/clearSessionMemory.ts`

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `DELETE`
*   **Path:** `/api/v1/chatmessage/{chatflowid}`
*   **Path Parameters:**
    *   `chatflowid` (string, format: uuid, required): ID of the chatflow for which messages will be deleted.
*   **Query Parameters (all optional):**
    *   `chatId` (string): If provided, focuses deletion on this specific chat ID within the chatflow. Triggers session memory clearing for this `chatId`.
    *   `memoryType` (string): Used with `chatId` for session memory clearing and message filtering.
    *   `sessionId` (string): Used with `chatId` for session memory clearing and message filtering.
    *   `chatType` (string or array of string): Filter messages by type(s).
    *   `startDate` (string, format: date-time ISO8601): Filter messages created on or after this date.
    *   `endDate` (string, format: date-time ISO8601): Filter messages created on or before this date.
    *   `isClearFromViewMessageDialog` (string, typically boolean as string 'true'/'false'): Hint for session memory clearing.
    *   `feedbackType` (string or array of string): If provided (implicitly makes `feedback=true`), filters messages to be deleted based on feedback.
    *   `hardDelete` (boolean, optional): If `chatId` is NOT provided and `hardDelete` is true, attempts to clear session memory from third-party integrations for all affected chat sessions.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Chat messages deleted successfully. Returns a `DeleteResult` object (from TypeORM) indicating `raw` data and `affected` row count.
    *   **Content (`application/json`):** Schema: `{ raw: array, affected: number }`.
*   **`404 Not Found`:**
    *   **Description:** `Chatflow` with the specified `chatflowid` not found (checked by controller).
    *   **Content (`text/plain` or `application/json`):** String message or ErrorResponse.
*   **`412 Precondition Failed`:**
    *   **Description:** `chatflowid` (path parameter `:id`) not provided.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Error during database operation or session memory clearing.
    *   **Content (`text/plain` or `application/json`):** String message or ErrorResponse.

**Core Logic Summary:**
1. Controller receives `chatflowid` from path and various optional filters from query params.
2. Retrieves `ChatFlow` to get node data for session memory clearing.
3. **If `chatId` is NOT in query:**
    a. Gets all messages matching filters (using `utilGetChatMessage`).
    b. If `hardDelete`, clears session memory for all unique `chatId_memoryType_sessionId` combinations found.
    c. Deletes messages by their collected IDs using `service.removeChatMessagesByMessageIds` (also handles feedback and file storage cleanup).
4. **If `chatId` IS in query:**
    a. Clears session memory for the given `chatflowid`, `chatId`, `memoryType`, `sessionId`.
    b. Deletes messages using `service.removeAllChatMessages` based on a constructed `deleteOptions` filter.
5. Returns `DeleteResult`.
