# Endpoint Analysis: GET /api/v1/public-executions/:id

**Module:** `public-executions`
**Operation ID:** `getPublicExecutionById`
**Description:** Retrieves a specific execution record by ID, if it's marked as public. Credential details are automatically redacted from the executionData.

**Key Files:**
*   Router: `packages/server/src/routes/public-executions/index.ts`
*   Controller: `packages/server/src/controllers/executions/index.ts` (Handler: `getPublicExecutionById`)
*   Service: `packages/server/src/services/executions/index.ts` (Method: `getPublicExecutionById`)
*   Entity: `packages/server/src/database/entities/Execution.ts`

**Authentication:** None (this is a public endpoint).

**Request:**
*   Method: `GET`
*   Path: `/api/v1/public-executions/:id`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the execution record to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the public execution record.
    *   Content (`application/json`): The execution object with the following key properties:
        *   `id` (string, uuid): Unique identifier of the execution.
        *   `executionData` (string): JSON stringified data of the execution with credential IDs removed.
        *   `state` (enum): Current state of the execution (INPROGRESS, FINISHED, ERROR, TERMINATED, TIMEOUT, STOPPED).
        *   `agentflowId` (string, uuid): ID of the ChatFlow (Agentflow) this execution belongs to.
        *   `sessionId` (string, uuid): Session ID for this execution.
        *   `action` (string, nullable): Last action taken in the execution (if applicable).
        *   `isPublic` (boolean): Will be true for public executions.
        *   `createdDate`, `updatedDate`, `stoppedDate` (date-time): Timestamps related to the execution.

*   **`404 Not Found`:**
    *   Description: Execution record with the specified ID not found or not marked as public.
    *   Content (`application/json`): Schema `$ref: '../../schemas/shared/CommonSchemas.yaml#/components/schemas/ErrorResponse'`.

*   **`500 Internal Server Error`:**
    *   Description: Other server-side issues.
    *   Content (`application/json`): Schema `$ref: '../../schemas/shared/CommonSchemas.yaml#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller extracts `id` from request parameters
2. Calls `executionsService.getPublicExecutionById(id)`
3. Service verifies that the execution exists and has `isPublic: true`
4. Service processes the executionData to remove any credential IDs
5. Controller returns the processed execution record as JSON

**Security Notes:**
- This endpoint is designed to provide access to execution records that have been explicitly marked as public
- Credential information is automatically redacted from the executionData before being returned
- Non-public executions will result in a 404 Not Found response, not distinguishing between non-existent records and private records

**Additional Notes:**
- The router also supports the path `/api/v1/public-executions/` (without an ID parameter), which maps to the same controller method. This will likely result in a 404 since the controller expects an ID parameter.
- The execution record contains a reference to its parent agentflow (ChatFlow), but this relationship data is not included in the response. 