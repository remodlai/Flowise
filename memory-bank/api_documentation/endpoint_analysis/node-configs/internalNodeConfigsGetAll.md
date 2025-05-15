# Endpoint Analysis: POST /api/v1/node-config/

**Module:** `node-configs`
**Operation ID:** `internalNodeConfigsGetAll`
**Description:** Retrieves available configuration options for a node or nodes based on the provided input data. This is used to dynamically populate node configuration UI elements based on the node type and its current values.

**Key Files:**
*   Router: `routes/node-configs/index.ts`
*   Controller: `controllers/node-configs/index.ts` (Handler: `getAllNodeConfigs`)
*   Service: `services/node-configs/index.ts` (Method: `getAllNodeConfigs`)
*   Utility: `utils/index.ts` (Function: `findAvailableConfigs`)

**Authentication:** Requires API Key.

**Request:**
*   Method: `POST`
*   Path: `/api/v1/node-config/` (Note: The route is registered as 'node-config' singular, not 'node-configs' plural)
*   Headers: `Content-Type: application/json`
*   Request Body: Node data object describing the node to retrieve configurations for. This is typically the same data structure that's used internally to represent a node in the flow editor.
*   Example Request Body:
    ```json
    {
      "name": "chatOpenAI",
      "label": "ChatOpenAI",
      "type": "ChatOpenAI",
      "category": "Chat Models",
      "inputs": {
        "modelName": "gpt-3.5-turbo",
        "temperature": 0.7
      }
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved the available configurations for the node.
    *   Content (`application/json`):
        *   Schema: An array of configuration objects, each describing a configurable parameter.
        *   Example Response:
            ```json
            [
              {
                "node": "ChatOpenAI",
                "nodeId": "node_123",
                "label": "Model Name",
                "name": "modelName",
                "type": "string"
              },
              {
                "node": "ChatOpenAI",
                "nodeId": "node_123",
                "label": "Temperature",
                "name": "temperature",
                "type": "number"
              },
              {
                "node": "ChatOpenAI",
                "nodeId": "node_123",
                "label": "OpenAI API Key",
                "name": "apiKey",
                "type": "string"
              }
            ]
            ```
*   **`412 Precondition Failed`:**
    *   Description: Request body not provided.
    *   Content (`application/json`): Error response with message.
*   **`500 Internal Server Error`:**
    *   Description: Error during configuration processing.
    *   Content (`application/json`): Error response with details.

**Core Logic Summary:**
1. Controller validates presence of `req.body`.
2. Calls service `getAllNodeConfigs(req.body)` with the node data from the request body.
3. Service uses the utility function `findAvailableConfigs` with the node data as an array.
4. The `findAvailableConfigs` function processes the node data, analyzing all input parameters:
   - Extracts file input configurations
   - Processes option-type parameters
   - Handles credential-type parameters by looking up their specific configuration options
   - Processes array-type parameters by extracting their schema structure
   - Handles standard parameter types (string, number, boolean, etc.)
5. Returns an array of configuration objects containing details like node name, label, parameter name, and type.

**Implementation Notes:**
* The function doesn't access a file named `node-configs.json` - it dynamically generates configurations based on the node's input parameters and credential requirements.
* When credential parameters are present, it looks up credential-specific input fields from the `componentCredentials` pool.
* For array-type parameters, it extracts a schema that describes the structure of each array item.
* The response is used by the UI to dynamically generate configuration forms specific to each node type.
* All configuration parameters are properly deduplicated to avoid repetition. 