# Endpoint Analysis: DELETE /api/v1/tools/{id}

**Module:** `tools`
**Operation ID:** `internalToolsDelete`
**Description:** Deletes a specific custom tool definition by its ID.

**Key Files:**
*   Router: `packages/server/src/routes/tools/index.ts`
*   Controller: `packages/server/src/controllers/tools/index.ts` (Handler: `deleteTool`)
*   Service: `packages/server/src/services/tools/index.ts` (Method: `deleteTool`)
*   Entity: `packages/server/src/database/entities/Tool.ts`

**Authentication:** Requires API Key.

**Request:**
*   Method: `DELETE`
*   Path: `/api/v1/tools/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the tool to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Tool deleted successfully.
    *   Content (`application/json`): TypeORM `DeleteResult` (e.g., `{ raw: [], affected: 1 }`).
*   **`412 Precondition Failed`:** `id` path parameter not provided.
*   **`500 Internal Server Error`:** Database error. 