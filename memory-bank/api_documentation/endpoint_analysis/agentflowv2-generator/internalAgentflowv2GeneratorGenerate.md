# Endpoint Analysis: `POST /api/v1/agentflowv2-generator/generate`

**Module:** `agentflowv2-generator`
**Description:** Generates a Remodl Core AgentFlow V2 graph structure (nodes and edges) based on a user's natural language question/request and a selected chat model configuration. It utilizes available Agent Flow nodes, tools, and marketplace templates to construct the flow.
**Note:** The specific structure expected for `selectedChatModel` would correspond to how chat model nodes are configured in Remodl Core.

**Key Files:**
*   **Router File:** `packages/server/src/routes/agentflowv2-generator/index.ts`
*   **Controller File:** `packages/server/src/controllers/agentflowv2-generator/index.ts` (Handler: `generateAgentflowv2`)
*   **Service File:** `packages/server/src/services/agentflowv2-generator/index.ts` (Method: `generateAgentflowv2`)
*   **Core Logic Import:** `generateAgentflowv2 as generateAgentflowv2_json` from `flowise-components`.
*   **Schema Definitions (Zod):** Within the service file, defining `AgentFlowV2Type`, `NodeType`, `EdgeType`.

**Authentication:**
*   Requires API Key (standard Remodl Core `Authorization` header mechanism assumed, TBC).

**Processing Modes:**
*   **Direct Mode:** In the default configuration, requests are processed immediately, and the response is returned after completion.
*   **Queue Mode:** When `process.env.MODE === 'QUEUE'`, requests are instead added to a 'prediction' queue for asynchronous processing. The API call still waits for the job to complete before returning the response, but this allows for better resource management, parallel processing, and more stable behavior under load in production environments.

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/agentflowv2-generator/generate`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Request Body Schema (`application/json`):**
    *   `question` (string, required): The user's natural language request for the agent flow.
        *   *Example:* `"Build an agent that can research a topic using web search and then summarize the findings."`
    *   `selectedChatModel` (object, required): Configuration object for the chat model to be used by the generation process (and potentially as a default in the generated flow). Structure depends on Remodl Core's chat model node configurations.
        *   *Example (Illustrative):*
            ```json
            {
              "modelName": "gpt-4", 
              "temperature": 0.7 
              // ... other model params
            }
            ```
*   **Example Request Body:**
    ```json
    {
      "question": "Create an agent that can answer questions about the weather and has access to a calculator.",
      "selectedChatModel": {
        "modelName": "gpt-3.5-turbo",
        "temperature": 0.5
      }
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully generated an AgentFlow V2 structure.
    *   **Content (`application/json`):**
        *   Schema (based on `AgentFlowV2Type` Zod schema):
            *   `description?` (string)
            *   `usecases?` (array of string)
            *   `nodes` (array of `NodeType` objects):
                *   `NodeType`: `{ id: string, type: string, position: {x: number, y: number}, width: number, height: number, data?: any, selected?: boolean, positionAbsolute?: {x: number, y: number}, dragging?: boolean, parentNode?: string, ... }`
            *   `edges` (array of `EdgeType` objects):
                *   `EdgeType`: `{ source: string, sourceHandle: string, target: string, targetHandle: string, id: string, type?: string, data?: { sourceColor?: string, targetColor?: string, edgeLabel?: string, isHumanInput?: boolean }, ... }`
        *   **Example Response Body (Structure):**
            ```json
            {
              "description": "Agent to answer weather questions with a calculator.",
              "nodes": [
                { "id": "node_1", "type": "ChatInput", "position": {"x": 100, "y": 100}, "width": 150, "height": 80, "data": { /* ... */ } },
                { "id": "node_2", "type": "OpenAIChat", "position": {"x": 300, "y": 100}, "width": 150, "height": 80, "data": { /* ... */ } }
              ],
              "edges": [
                { "source": "node_1", "sourceHandle": "output", "target": "node_2", "targetHandle": "input", "id": "edge_1" }
              ]
            }
            ```
    *   **Alternatively, if response parsing/validation fails in the service:**
        *   Schema: `{ error: string, rawResponse: any }`
*   **`400 Bad Request` (from controller due to missing body fields):**
    *   **Description:** `question` or `selectedChatModel` missing in request body.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'` (standard error object).
    *   **Example:** `{ "statusCode": 400, "success": false, "message": "Error: Question and selectedChatModel are required" }` (Note: controller throws generic Error, caught by global handler)
*   **`500 Internal Server Error`:**
    *   **Description:** An unexpected error occurred during the generation process.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1.  Controller (`generateAgentflowv2`) validates presence of `question` and `selectedChatModel` in `req.body`.
2.  Controller calls `agentflowv2Service.generateAgentflowv2(req.body.question, req.body.selectedChatModel)`.
3.  Service (`generateAgentflowv2`):
    a.  Gathers available Remodl Core Agent Flow nodes, tools, and marketplace templates.
    b.  Constructs a detailed system prompt using this information and the user's `question`.
    c.  If in queue mode (`process.env.MODE === 'QUEUE'`):
        i.  Adds a job to the 'prediction' queue with all necessary data.
        ii. Waits for the job to complete and returns the result.
    d.  If in direct mode:
        i.  Calls `flowise-components.generateAgentflowv2_json` directly with the prompt and selected chat model.
    e.  Validates the generated structure against a Zod schema (`AgentFlowV2Type`).
4.  Controller returns the validated flow structure (nodes and edges) or a parsing error object.

**Performance Considerations:**
*   In production environments with the queue mode enabled, response times may vary based on queue load.
*   The response still waits for the completion of the generated flow, which could be time-consuming depending on the complexity of the request and the selected chat model.
*   For high-traffic production environments, consider implementing client-side timeout handling to manage potentially longer response times in queue mode.
