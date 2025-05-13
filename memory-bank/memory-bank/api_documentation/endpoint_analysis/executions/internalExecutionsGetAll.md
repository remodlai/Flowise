# Endpoint Analysis: GET /api/v1/executions/

**Module:** `executions`
**Operation ID:** `internalExecutionsGetAll`
**Description:** Retrieves all execution records, optionally filtered by `agentflowId` and `chatId` (likely maps to `sessionId` in entity).

**Key Files:**
*   Router: `routes/executions/index.ts`
*   Controller: `controllers/executions/index.ts` (Handler: `getAllExecutions`)
*   Service: `services/executions/index.ts` (Method: `getAllExecutions`)
*   Entity: `database/entities/Execution.ts`

**Authentication:** Requires API Key.

**Request Parameters (Query):**
*   `agentflowId` (string, optional): Filter by agentflow ID.
*   `chatId` (string, optional): Filter by chat/session ID.

**Responses:**
*   **`200 OK`:** Returns array of `Execution` entities.
*   **`500 Internal Server Error`**
