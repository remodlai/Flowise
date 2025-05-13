# Endpoint Analysis: POST /api/v1/node-load-method/{name}

**Module:** `node-load-methods`
**Operation ID:** `internalNodeLoadMethodsGetAsyncOptions`
**Description:** Executes a specific `loadMethod` defined on a node component to fetch dynamic options for its UI parameters. This is used, for example, to populate dropdowns with values from an external API or database. The node's current configuration (`INodeData`) is passed in the request body.

**Key Files:**
*   Router: `routes/node-load-methods/index.ts`
*   Controller: `controllers/nodes/index.ts` (Handler: `getSingleNodeAsyncOptions`)
*   Service: `services/nodes/index.ts` (Method: `getSingleNodeAsyncOptions`)
*   Interface: `flowise-components/src/Interface.ts` (`INodeData`, `INodeOptionsValue`)

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/node-load-method/{name}`
*   **Path Parameters:**
    *   `name` (string, required): The internal name of the node component whose load method is to be called (e.g., "vectorStoreChroma").
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema (`application/json`):**
    *   Represents `INodeData` from `flowise-components`. Key fields include:
        *   `inputs` (object): Current input values for the node.
        *   `credential` (string, optional): Credential ID if the load method requires it.
        *   `loadMethod` (string, required in `inputs` or top level): Name of the specific load method to execute on the node.
        *   Other fields like `id`, `name`, `label`, `type`, `inputParams`, `outputAnchors` from the node's definition might be present or used by the load method.
*   **Example Request Body:**
    ```json
    {
      "name": "chroma", 
      "inputs": {
        "loadMethod": "getCollections", 
        "credential": "chroma-credential-id"
      }
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully executed the load method and retrieved dynamic options.
    *   Content (`application/json`):
        *   Schema: Array of `INodeOptionsValue` objects.
            *   `INodeOptionsValue`: `{ label: string, name: string, description?: string, icon?: string, value?: string, parentGroup?: string }` (from `flowise-components`)
        *   Example: `[ { "label": "My Collection 1", "name": "collection_1" }, { "label": "My Collection 2", "name": "collection_2" } ]`
*   **`404 Not Found`:**
    *   Description: Node with the specified `name` not found, or the specified `loadMethod` does not exist on that node.
*   **`412 Precondition Failed`:**
    *   Description: `name` path parameter or request body not provided.
*   **`500 Internal Server Error`:** Error during load method execution.

**Core Logic Summary:**
1. Controller validates `req.params.name` and `req.body`.
2. Calls service `getSingleNodeAsyncOptions(name, req.body)`.
3. Service retrieves the node component definition from `appServer.nodesPool.componentNodes`.
4. If the node and its specified `loadMethod` (from `req.body.loadMethod` or `req.body.inputs.loadMethod`) exist, it calls that method. The method is passed the `req.body` (as `INodeData`) and context objects (DataSource, other nodes).
5. The node's `loadMethod` executes its logic (e.g., API call, DB query) and returns an array of `INodeOptionsValue`.
6. Service returns this array. Returns empty array if the load method itself has an internal error.
