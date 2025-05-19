# Endpoint Analysis: GET /api/v1/tools/{id}

**Module:** `tools`
**Operation ID:** `getToolById`
**Description:** Retrieves a specific custom tool definition by its ID.

**Key Files:**
*   **Router:** `packages/server/src/routes/tools/index.ts`
*   **Controller:** `packages/server/src/controllers/tools/index.ts` (Handler: `getToolById`)
*   **Service:** `packages/server/src/services/tools/index.ts` (Method: `getToolById`)
*   **Entity:** `packages/server/src/database/entities/Tool.ts`
*   **Interface:** `packages/server/src/Interface.ts` (Interface: `ITool`)

**Authentication:** Requires API Key (`ApiKeyAuth`).

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/tools/{id}` or `/api/v1/tools/`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the tool to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the tool.
    *   **Content (`application/json`):** Schema: `$ref: '../../schemas/modules/ToolsSchemas.yaml#/components/schemas/ToolSchema'`
        * Properties include id, name, description, color, iconSrc, schema, func, createdDate, and updatedDate.

*   **`404 Not Found`:**
    *   **Description:** Tool with the specified ID not found.
    *   **Content (`application/json`):** Standard error response object.

*   **`412 Precondition Failed`:**
    *   **Description:** ID path parameter not provided.
    *   **Content (`application/json`):** Standard error response object.

*   **`500 Internal Server Error`:**
    *   **Description:** Database error during tool retrieval.
    *   **Content (`application/json`):** Standard error response object.

**Core Logic Summary:**
1. Router registers both `/` and `/:id` paths to the same controller method.
2. Controller explicitly checks `req.params.id` and throws a 412 error with a detailed message if not provided.
3. Controller calls `toolsService.getToolById(req.params.id)`.
4. Service uses TypeORM to query the database for a Tool entity with the matching ID.
5. If no tool is found, service throws a 404 error with a message indicating the tool wasn't found.
6. Service returns the found Tool entity if found.
7. Controller sends the found tool as a JSON response.

**Implementation Notes:**
- The controller lacks error handling for invalid UUID formats, relying on TypeORM to handle that validation.
- The router registers both `/` and `/:id` paths to the same controller method, but the controller implementation requires the ID parameter.
- The service method uses TypeORM's `findOneBy` method which is the recommended approach for simple single-entity lookups.
- This endpoint is used by the UI to fetch tool details for display and editing.
- All database operations occur within the service layer, maintaining clean separation of concerns.
- The Tool entity includes a schema field which may contain a JSON string defining the tool's input schema and a func field containing JavaScript code for custom function tools. 