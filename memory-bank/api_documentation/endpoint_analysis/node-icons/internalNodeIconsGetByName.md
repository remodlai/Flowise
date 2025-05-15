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
    *   `name` (string, required): The internal name of the node component (e.g., "stringPrompt", "chatOpenAI").

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the node icon file.
    *   Content (`image/svg+xml`, `image/png`, `image/jpeg`): The raw image file.
*   **`404 Not Found`:**
    *   Description: Node with the specified `name` not found, or its icon property is missing/undefined.
    *   Content (`application/json`): Error response with message.
*   **`412 Precondition Failed`:**
    *   Description: `name` path parameter not provided, or icon path is not a valid image file (doesn't end with .svg, .png, or .jpg).
    *   Content (`application/json`): Error response with message.
*   **`500 Internal Server Error`:** 
    *   Description: Error reading the icon file or other server-side issue.
    *   Content (`application/json`): Error response with detailed error message.

**Core Logic Summary:**
1. Controller validates `req.params.name`.
2. Calls service `getSingleNodeIcon(name)`.
3. Service looks up the node definition in `appServer.nodesPool.componentNodes`.
4. Validates that the node exists and has an icon property defined.
5. Verifies that the icon path ends with a supported image extension (.svg, .png, or .jpg).
6. If valid, returns the file path.
7. Controller uses `res.sendFile()` to stream the file directly from the file system.

**Implementation Notes:**
* There is no separate controller or service specifically for node-icons - it reuses functionality from the nodes module.
* The endpoint serves raw image files directly from the file system, not base64-encoded images or other formats.
* The error handling is quite thorough, with specific error codes for different failure scenarios.
* No caching headers are explicitly set in the implementation, so browser caching behavior will depend on defaults.
* The implementation doesn't stream or resize the images - they are sent as-is from the file system.
* Icons are an integral part of node components and are loaded when the application starts, so this endpoint provides direct access to pre-loaded assets.
