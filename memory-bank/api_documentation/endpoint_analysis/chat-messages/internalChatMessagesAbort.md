# Endpoint Analysis: PUT /api/v1/chatmessage/abort/:chatflowid/:chatid

**Module:** `chat-messages`
**Operation ID:** `internalChatMessagesAbort`
**Description:** Aborts an ongoing chat message processing operation for a specific chatflow and chat session. This is particularly useful for stopping long-running operations like streaming responses.

**Key Files:**
* **Router:** `packages/server/src/routes/chat-messages/index.ts`
* **Controller:** `packages/server/src/controllers/chat-messages/index.ts` (Handler: `abortChatMessage`)
* **Service:** `packages/server/src/services/chat-messages/index.ts` (Method: `abortChatMessage`)

**Authentication:** Requires API Key.

**Request:**
* **Method:** `PUT`
* **Path:** `/api/v1/chatmessage/abort/:chatflowid/:chatid`
* **Path Parameters:**
  * `chatflowid` (string, UUID, required): ID of the chatflow to abort.
  * `chatid` (string, required): ID of the chat session to abort.

**Alternate Route:**
* **Path:** `/api/v1/chatmessage/abort/`
* **Method:** `PUT`
* **Body (JSON):**
  * `chatflowid` (string, UUID, required): ID of the chatflow to abort.
  * `chatid` (string, required): ID of the chat session to abort.

**Processing Notes:**
* The implementation checks for the presence of both `chatflowid` and `chatid` before proceeding.
* If running in queue mode (process.env.MODE === MODE.QUEUE), publishes an abort event to the prediction queue.
* Otherwise, directly aborts the controller using the `abortControllerPool.abort(id)` method.

**Responses:**
* **`200 OK`:** Chat message processing aborted successfully.
  * Response body: `{ status: 200, message: 'Chat message aborted' }`
* **`412 Precondition Failed`:** Required parameters missing.
* **`500 Internal Server Error`:** Error during abort process.

**Security Considerations:**
* Should be protected with API key authentication to prevent unauthorized interruption of chatflows.

**Implementation Details:**
* This endpoint is specifically useful for controlling potentially expensive or long-running operations.
* Combines chatflowid and chatid into a composite key for targeting the specific operation to abort.