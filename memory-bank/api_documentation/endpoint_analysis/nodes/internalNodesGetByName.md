# Endpoint Analysis: GET /api/v1/nodes/{name}

**Module:** `nodes`
**Operation ID:** `internalNodesGetByName`
**Description:** Retrieves the definition for a specific node component by its name. Used to get detailed configuration for a particular node type.

**Key Files:**
*   **Router:** `packages/server/src/routes/nodes/index.ts`
*   **Controller:** `packages/server/src/controllers/nodes/index.ts` (Handler: `getNodeByName`)
*   **Service:** `packages/server/src/services/nodes/index.ts` (Method: `getNodeByName`)
*   **Data Source:** `appServer.nodesPool.componentNodes[nodeName]` (in-memory pool of all loaded node component definitions)
*   **Schema Reference:** `NodeComponentDefinition` (defined in `api_documentation/schemas/modules/NodesSchemas.yaml`, based on `INode` from `flowise-components`)

**Authentication:**
*   Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/nodes/{name}`
*   **Path Parameters:**
    *   `name` (string, required): The internal name of the node component to retrieve (e.g., "chatOpenAI").

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the node component definition.
    *   **Content (`application/json`)**:
        *   Schema: A `NodeComponentDefinition` object describing the node component, including its `label`, `name` (internal ID), `version`, `type`, `category`, `icon`, `baseClasses`, and `inputs`/`outputs`/`inputAnchors`/`outputAnchors` parameter definitions.
        *   Example: The complete definition of the ChatOpenAI node with all its parameters, input/output types, etc.
*   **`404 Not Found`:**
    *   **Description:** Node with the specified name not found.
    *   **Content (`application/json`):** Error response with message.
*   **`412 Precondition Failed`:**
    *   **Description:** Name parameter not provided.
    *   **Content (`application/json`):** Error response with message.
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred while accessing node definition.
    *   **Content (`application/json`):** Error response with message.

**Core Logic Summary:**
1.  Controller (`getNodeByName`) validates presence of `req.params.name`.
2.  Calls service method `nodesService.getNodeByName(req.params.name)`.
3.  Service checks if the node name exists in `appServer.nodesPool.componentNodes`.
4.  If found, returns the node definition directly (without cloning).
5.  If not found, throws a `NOT_FOUND` error.
6.  Controller returns the node definition as JSON or passes any error to the error handler.

**Implementation Notes:**
* Unlike the `getAllNodes` method, this endpoint returns the original node definition object without cloning.
* The node definition can be quite large and complex, containing detailed information about the node's parameters, UI configuration, and runtime behavior.
* This endpoint is primarily used by the UI when a user selects a specific node to add to their flow, to get its full configuration.
* All loaded node components are kept in memory in the `appServer.nodesPool.componentNodes` object, keyed by their name.