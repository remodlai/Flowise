# Endpoint Analysis: PUT /api/v1/tools/{id}

**Module:** `tools`
**Operation ID:** `internalToolsUpdate`
**Description:** Updates an existing custom tool definition by its ID.

**Key Files:**
*   Router: `packages/server/src/routes/tools/index.ts`
*   Controller: `packages/server/src/controllers/tools/index.ts` (Handler: `updateTool`)
*   Service: `packages/server/src/services/tools/index.ts` (Method: `updateTool`)
*   Entity: `packages/server/src/database/entities/Tool.ts`
*   Schema File: `api_documentation/schemas/modules/ToolsSchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `PUT`
*   Path: `/api/v1/tools/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the tool to update.
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema:** `$ref: '../../schemas/modules/ToolsSchemas.yaml#/components/schemas/ToolUpdateRequest'`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Tool updated successfully.
    *   Content (`application/json`): Schema `$ref: '../../schemas/modules/ToolsSchemas.yaml#/components/schemas/ToolSchema'`.
*   **`404 Not Found`:** Tool with the specified ID not found.
*   **`412 Precondition Failed`:** `id` or request body not provided.
*   **`500 Internal Server Error`:** Database error. 