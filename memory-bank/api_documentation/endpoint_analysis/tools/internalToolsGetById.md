# Endpoint Analysis: GET /api/v1/tools/{id}

**Module:** `tools`
**Operation ID:** `internalToolsGetById`
**Description:** Retrieves a specific custom tool definition by its ID.

**Key Files:**
*   Router: `packages/server/src/routes/tools/index.ts`
*   Controller: `packages/server/src/controllers/tools/index.ts` (Handler: `getToolById`)
*   Service: `packages/server/src/services/tools/index.ts` (Method: `getToolById`)
*   Entity: `packages/server/src/database/entities/Tool.ts`
*   Schema File: `api_documentation/schemas/modules/ToolsSchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/tools/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the tool to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the tool.
    *   Content (`application/json`): Schema `$ref: '../../schemas/modules/ToolsSchemas.yaml#/components/schemas/ToolSchema'`.
*   **`404 Not Found`:** Tool with the specified ID not found.
*   **`412 Precondition Failed`:** `id` path parameter not provided.
*   **`500 Internal Server Error`:** Database error. 