# Endpoint Analysis: GET /api/v1/node-configs/{name}

**Module:** `node-configs`
**Operation ID:** `internalNodeConfigsGetSingleByName`
**Description:** Retrieves the saved UI configuration for a specific node type. These configurations are typically stored in a `node-configs.json` file and define how a node's parameters are displayed and managed in the UI.

**Key Files:**
*   Router: `routes/node-configs/index.ts`
*   Controller: `controllers/node-configs/index.ts` (Handler: `getSingleNodeConfig`)
*   Service: `services/node-configs/index.ts` (Method: `getSingleNodeConfig`)
*   Data Source: `node-configs.json` (located in the server's root directory)

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/node-configs/{name}`
*   **Path Parameters:**
    *   `name` (string, required): The internal name of the node component (e.g., "stringPrompt").

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the node configuration.
    *   Content (`application/json`):
        *   Schema: An object representing the node's UI configuration. Structure can vary but often includes fields like `inputParams`, `inputAnchors`, `outputAnchors`, `style`, `icon`, `version`, etc. (Reflects the structure within `node-configs.json` for the given node name).
*   **`404 Not Found`:**
    *   Description: Node configuration with the specified `name` not found in `node-configs.json`.
*   **`412 Precondition Failed`:**
    *   Description: `name` path parameter not provided.
*   **`500 Internal Server Error`:** Error reading or parsing `node-configs.json`.

**Core Logic Summary:**
1. Controller validates `req.params.name`.
2. Calls service `getSingleNodeConfig(name)`.
3. Service reads `node-configs.json` from the server root.
4. Finds the configuration object within the JSON data where the key matches the provided `name`.
5. If found, returns the configuration object. If not, throws a 404 error.
