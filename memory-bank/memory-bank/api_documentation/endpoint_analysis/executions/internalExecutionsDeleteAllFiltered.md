# Endpoint Analysis: DELETE /api/v1/executions/

**Module:** `executions`
**Operation ID:** `internalExecutionsDeleteAllFiltered`
**Description:** Deletes multiple execution records, optionally filtered by `agentflowId` and `chatId` (sessionId).

**Key Files:**
* Router: `routes/executions/index.ts`
* Controller: `controllers/executions/index.ts` (Handler: `deleteExecutions`, root path)
* Service: `services/executions/index.ts` (Method: `deleteAllExecutions`)
* Entity: `database/entities/Execution.ts`

**Authentication:** Requires API Key.

**Request Parameters (Query):**
*   `agentflowId` (string, optional): Filter by agentflow ID.
*   `chatId` (string, optional): Filter by chat/session ID.

**Responses:**
*   **`200 OK`:** Returns TypeORM `DeleteResult`.
*   **`500 Internal Server Error`**
