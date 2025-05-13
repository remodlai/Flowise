# Endpoint Analysis: DELETE /api/v1/executions/{id}

**Module:** `executions`
**Operation ID:** `internalExecutionsDeleteById`
**Description:** Deletes a single execution record by its ID.

**Key Files:**
* Router: `routes/executions/index.ts`
* Controller: `controllers/executions/index.ts` (Handler: `deleteExecutions`, specific path)
* Service: `services/executions/index.ts` (Method: `deleteExecution`)
* Entity: `database/entities/Execution.ts`

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, required): Execution ID to delete.

**Responses:**
*   **`200 OK`:** Returns TypeORM `DeleteResult`.
*   **`404 Not Found`**
*   **`412 Precondition Failed`**
*   **`500 Internal Server Error`**
