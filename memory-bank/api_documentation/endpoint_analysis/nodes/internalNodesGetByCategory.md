# Endpoint Analysis: GET /api/v1/nodes/category/{name}

**Module:** `nodes`
**Operation ID:** `internalNodesGetByCategory`
**Description:** Retrieves definitions for all node components that belong to a specific category (e.g., "Chat Models", "Chains", "Tools"). Used to populate category-specific node selection UI.

**Key Files:**
*   **Router:** `packages/server/src/routes/nodes/index.ts`
*   **Controller:** `packages/server/src/controllers/nodes/index.ts` (Handler: `getNodesByCategory`)
*   **Service:** `packages/server/src/services/nodes/index.ts` (Method: `getAllNodesForCategory`)
*   **Data Source:** `appServer.nodesPool.componentNodes` filtered by `.category` property (in-memory pool of all loaded node component definitions)
*   **Schema Reference:** `NodeComponentDefinition` (defined in `api_documentation/schemas/modules/NodesSchemas.yaml`, based on `INode` from `flowise-components`)

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/nodes/category/{name}`
*   **Path Parameters:**
    *   `name` (string, required): The category name to filter nodes by (e.g., "Chat Models", "Chains", "Tools").

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved node component definitions filtered by category.
    *   **Content (`application/json`)**:
        *   Schema: Array of `NodeComponentDefinition` objects, each describing a node component that belongs to the specified category. Includes `label`, `name` (internal ID), `version`, `type`, `category`, `icon`, `baseClasses`, and `inputs`/`outputs`/`inputAnchors`/`outputAnchors` parameter definitions.
        *   Example: If searching for category "Chat Models", might return definitions for ChatOpenAI, ChatAnthropic, ChatOllama, etc.
*   **`412 Precondition Failed`:**
    *   **Description:** Category name parameter not provided or empty.
    *   **Content (`application/json`):** Error response with message.
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred while accessing node definitions.
    *   **Content (`application/json`):** Error response with message.

**Core Logic Summary:**
1.  Controller (`getNodesByCategory`) validates presence and non-emptiness of `req.params.name`.
2.  Unescapes the category name using `_.unescape(req.params.name)` to handle URL-encoded characters.
3.  Calls service method `nodesService.getAllNodesForCategory(name)`.
4.  Service iterates through `appServer.nodesPool.componentNodes` and filters nodes where `.category === category`.
5.  For each matching node, creates a deep clone of the node definition and adds it to the response array.
6.  Returns the array of cloned node definitions.
7.  Controller returns this array as JSON or passes any error to the error handler.

**Implementation Notes:**
* This endpoint performs deep cloning of node definitions using Lodash's `cloneDeep` to ensure the original definitions aren't modified.
* The category filtering is case-sensitive and requires an exact match.
* This endpoint is primarily used by the UI to populate node selection panels for each category.
* If no nodes match the specified category, an empty array is returned rather than an error.
* The unescaping of the category name with `_.unescape()` allows for categories with special characters that might be URL-encoded.