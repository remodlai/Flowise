# Endpoint Analysis: GET /api/v1/nodes/

**Module:** `nodes`
**Operation ID:** `internalNodesGetAll`
**Description:** Retrieves definitions for all available Remodl Core node components (e.g., chat models, LLMs, tools, chains, etc.) loaded in the application.

**Key Files:**
*   **Router:** `packages/server/src/routes/nodes/index.ts`
*   **Controller:** `packages/server/src/controllers/nodes/index.ts` (Handler: `getAllNodes`)
*   **Service:** `packages/server/src/services/nodes/index.ts` (Method: `getAllNodes`)
*   **Data Source:** `appServer.nodesPool.componentNodes` (in-memory pool of all loaded node component definitions)
*   **Schema Reference:** `NodeComponentDefinition` (defined in `api_documentation/schemas/shared/flowiseComponentSchemas.yaml`, based on `INode` from `flowise-components`)

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism).

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/nodes/`
*   **Query Parameters:** None

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved all node component definitions.
    *   **Content (`application/json`):
        *   Schema: Array of `NodeComponentDefinition` objects. Each object describes a node component, including its `label`, `name` (internal ID), `version`, `type`, `category`, `icon`, `baseClasses`, and `inputs`/`outputs`/`inputAnchors`/`outputAnchors` parameter definitions.
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred while accessing node definitions.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1.  Controller (`getAllNodes`) calls `nodesService.getAllNodes()`.
2.  Service (`getAllNodes`) iterates through `appServer.nodesPool.componentNodes`.
3.  For each node component, it creates a deep clone of its definition.
4.  Returns an array of these cloned node definitions.
5.  Controller returns this array as JSON.
