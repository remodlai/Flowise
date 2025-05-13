# Endpoint Analysis: PUT /api/v1/executions/{id}

**Module:** `executions`
**Operation ID:** `internalExecutionsUpdate`
**Description:** Updates the state and/or executionData of an existing execution record.

**Key Files:**
* Router: `routes/executions/index.ts`
* Controller: `controllers/executions/index.ts` (Handler: `updateExecution`)
* Service: `services/executions/index.ts` (Method: `updateExecution`)
* Entity: `database/entities/Execution.ts`
* Interface: `ExecutionState` enum

**Authentication:** Requires API Key.

**Request Parameters (Path):**
*   `id` (string, format: uuid, required): Execution ID.

**Request Body (`application/json`):**
*   `state?` (string, enum from `ExecutionState`): New state.
*   `executionData?` (string, JSON): New execution data.

**Responses:**
*   **`200 OK`:** Returns the updated `Execution` entity (with parsed data fields).
*   **`404 Not Found`**
*   **`412 Precondition Failed`**
*   **`500 Internal Server Error`**
