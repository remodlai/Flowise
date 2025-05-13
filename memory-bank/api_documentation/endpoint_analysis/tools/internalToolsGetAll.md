# Endpoint Analysis: GET /api/v1/tools/

**Module:** `tools`
**Operation ID:** `internalToolsGetAll`
**Description:** Retrieves a list of all custom tool definitions stored in the database.

**Key Files:**
*   Router: `packages/server/src/routes/tools/index.ts`
*   Controller: `packages/server/src/controllers/tools/index.ts` (Handler: `getAllTools`)
*   Service: `packages/server/src/services/tools/index.ts` (Method: `getAllTools`)
*   Entity: `packages/server/src/database/entities/Tool.ts`
*   Schema File: `api_documentation/schemas/modules/ToolsSchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/tools/`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved all tools.
    *   Content (`application/json`): Schema: Array of `$ref: '../../schemas/modules/ToolsSchemas.yaml#/components/schemas/ToolSchema'`.
*   **`500 Internal Server Error`:** Database error.

**Core Logic Summary:**
1. Controller calls `toolsService.getAllTools()`.
2. Service queries the database for all `Tool` entities.
3. Returns an array of found `Tool` entities. 