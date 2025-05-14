# Endpoint Analysis: POST /api/v1/node-configs/

**Module:** `node-configs`
**Operation ID:** `internalNodeConfigsGetAll`
**Description:** Retrieves UI configurations for multiple node component types in a single request. These configurations define how each node's parameters are displayed and managed in the UI.

**Key Files:**
*   Router: `routes/node-configs/index.ts`
*   Controller: `controllers/node-configs/index.ts` (Handler: `getAllNodeConfigs`)
*   Service: `services/node-configs/index.ts` (Method: `getAllNodeConfigs`)
*   Data Source: `node-configs.json` (located in the server's root directory)

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/node-configs/`
*   Headers: `Content-Type: application/json`
*   Body: Array of node component names (strings) for which to retrieve configurations.
*   Example Request Body:
    ```json
    ["stringPrompt", "llmChain", "chatPromptTemplate"]
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the requested node configurations.
    *   Content (`application/json`):
        *   Schema: An object with node component names as keys and their configurations as values.
        *   Example Response:
            ```json
            {
              "stringPrompt": {
                "inputParams": [...],
                "inputAnchors": [...],
                "outputAnchors": [...],
                "style": { "width": 180 },
                "version": 1
              },
              "llmChain": {
                "inputParams": [...],
                "inputAnchors": [...],
                "outputAnchors": [...],
                "style": { "width": 200 },
                "version": 1
              }
            }
            ```
*   **`412 Precondition Failed`:**
    *   Description: Request body not provided.
*   **`500 Internal Server Error`:** Error reading or parsing `node-configs.json`.

**Core Logic Summary:**
1. Controller validates presence of `req.body`.
2. Calls service `getAllNodeConfigs(nodeNames)` with the array of node names from the request body.
3. Service reads `node-configs.json` from the server root.
4. Filters the configurations to include only those for the requested node names.
5. Returns an object with the requested node configurations, using node names as keys. 