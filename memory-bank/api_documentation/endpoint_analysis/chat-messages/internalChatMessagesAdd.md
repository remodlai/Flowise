# Endpoint Analysis: POST /api/v1/chatmessage/

**Module:** `chat-messages`
**Operation ID:** `internalChatMessagesAdd`
**Base Path Note:** Singular `/api/v1/chatmessage/`.
**Description:** Adds a new chat message to a chatflow. The request body should conform to the `IChatMessage` interface (partially).

**Key Files:**
*   **Router:** `packages/server/src/routes/chat-messages/index.ts`
*   **Controller:** `packages/server/src/controllers/chat-messages/index.ts` (Handler: `createChatMessage`)
*   **Service:** `packages/server/src/services/chat-messages/index.ts` (Method: `createChatMessage`)
*   **Entity:** `packages/server/src/database/entities/ChatMessage.ts`
*   **Interface:** `packages/server/src/Interface.ts` (for `IChatMessage`, `MessageType`)

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/chatmessage/`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Request Body Schema (`application/json`):** (Based on `IChatMessage` and `ChatMessage` entity)
    *   `role` (string, required, enum from `MessageType`: `apiMessage`, `userMessage`, `uiMessage`, `toolMessage`, `systemMessage`, `functionMessage`): Role of the message sender.
    *   `chatflowid` (string, format: uuid, required): ID of the parent chatflow.
    *   `content` (string, required): The message content.
    *   `chatType` (string, required, e.g., `INTERNAL`, `EXTERNAL`, `STREAMING`, `EMBEDDED` - from `ChatType` enum): Type of chat.
    *   `chatId` (string, required): ID of the chat session.
    *   `executionId?` (string, format: uuid, optional): Associated execution ID.
    *   `sourceDocuments?` (string, optional): JSON string of source documents.
    *   `usedTools?` (string, optional): JSON string of used tools.
    *   `fileAnnotations?` (string, optional): JSON string of file annotations.
    *   `agentReasoning?` (string, optional): JSON string of agent reasoning steps.
    *   `fileUploads?` (string, optional): JSON string of file upload details.
    *   `artifacts?` (string, optional): JSON string of artifacts.
    *   `action?` (string, optional, nullable): JSON string of a tool action.
    *   `memoryType?` (string, optional): Type of memory used for this message context.
    *   `sessionId?` (string, optional): Session ID if distinct from `chatId`.
    *   `leadEmail?` (string, optional): Email of a lead associated with this message.
    *   `followUpPrompts?` (string, optional): JSON string of suggested follow-up prompts.
*   **Example Request Body:**
    ```json
    {
      "role": "userMessage",
      "chatflowid": "chatflow-uuid",
      "content": "Hello, world!",
      "chatType": "EXTERNAL",
      "chatId": "chat-session-uuid"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Chat message added successfully. Returns the created `ChatMessage` object (with stringified JSON fields parsed back by the controller).
    *   **Content (`application/json`):** Schema based on `ChatMessage` entity.
*   **`412 Precondition Failed`:**
    *   **Description:** Request body not provided.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`500 Internal Server Error`:**
    *   **Description:** Database error or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller validates presence of `req.body`.
2. Service (`createChatMessage`) takes the request body (`Partial<IChatMessage>`).
3. Creates a new `ChatMessage` entity instance, assigns properties from the request body.
4. Saves the new `ChatMessage` to the database.
5. Controller uses `parseAPIResponse` to convert stringified JSON fields in the saved entity to nested JSON before returning.
