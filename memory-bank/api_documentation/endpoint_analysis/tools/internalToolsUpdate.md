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

**Core Logic Summary:**
1. Controller checks `req.params.id` and `req.body`.
2. Calls `toolsService.updateTool(req.params.id, req.body)`.
3. Service first checks if the tool with the specified ID exists.
4. If not found, a 404 error is thrown.
5. Creates an object with the updated properties and merges it with the existing record.
6. Saves the updated entity and returns it.

**Additional Notes:**
- The router also supports the path `/api/v1/tools/` (without an ID parameter), which maps to the same controller method. This will result in a 412 Precondition Failed error as the controller requires an ID parameter. 