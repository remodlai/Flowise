# Endpoint Analysis: GET /api/v1/node-icon/{name}

**Module:** `node-icons` (Routed via `node-icon`)
**Operation ID:** `internalNodeIconsGetByName`
**Description:** Retrieves the icon file (SVG, PNG, or JPG) for a specified node component name. The icon is served directly from the file system path defined in the node's component definition.

**Key Files:**
*   Router: `routes/node-icons/index.ts`
*   Controller: `controllers/nodes/index.ts` (Handler: `getSingleNodeIcon`)
*   Service: `services/nodes/index.ts` (Method: `getSingleNodeIcon`)
*   Data Source: `appServer.nodesPool.componentNodes[nodeName].icon` (path to icon file)

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/node-icon/{name}`
*   **Path Parameters:**
    *   `name` (string, required): The internal name of the node component (e.g., "stringPrompt", "openAIApi").

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the node icon file.
    *   Content (`image/svg+xml`, `image/png`, `image/jpeg`): The raw image file.
*   **`404 Not Found`:**
    *   Description: Node with the specified `name` not found, or its icon property is missing/invalid.
    *   Content (`application/json`): Schema `$ref: '#/components/schemas/ErrorResponse'`.
*   **`412 Precondition Failed`:**
    *   Description: `name` path parameter not provided.
*   **`500 Internal Server Error`:** Error reading the icon file or other server-side issue.

**Core Logic Summary:**
1. Controller validates `req.params.name`.
2. Calls service `getSingleNodeIcon(name)`.
3. Service looks up the node definition in `appServer.nodesPool.componentNodes`.
4. If found and `nodeInstance.icon` is a valid image path, returns the file path.
5. Controller uses `res.sendFile()` to stream the file.
