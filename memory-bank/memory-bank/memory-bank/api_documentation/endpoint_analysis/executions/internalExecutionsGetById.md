# Endpoint Analysis: GET /api/v1/executions/{id}

**Module:** `executions`
**Operation ID:** `internalExecutionsGetById`
**Description:** Retrieves a specific execution record by its ID.

**Key Files:**
* Router: `routes/executions/index.ts`
* Controller: `controllers/executions/index.ts` (Handler: `getExecutionById`)
* Service: `services/executions/index.ts` (Method: `getExecutionById`)
* Entity: `database/entities/Execution.ts`

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, required): The ID of the execution record.

**Responses:**
*   **`200 OK`:** Returns the `Execution` entity. The `executionData` (JSON string) and `action` (JSON string) fields are parsed into objects by the controller before sending.
*   **`404 Not Found`:** If execution with the given ID is not found.
*   **`412 Precondition Failed`:** If `id` is not provided.
*   **`500 Internal Server Error`**
