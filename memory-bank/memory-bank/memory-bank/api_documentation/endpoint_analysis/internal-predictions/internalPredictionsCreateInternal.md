# Endpoint Analysis: POST /api/v1/internal-predictions/{id}

**Module:** `internal-predictions`
**Operation ID:** `internalPredictionsCreateInternal` (Re-using previous ID, matches pattern)
**Description:** Executes a chatflow identified by `:id` for internal, non-streaming predictions. This is typically used by tools or other server-side processes that need to run a chatflow and get a direct response.

**Key Files:**
*   **Router:** `packages/server/src/routes/internal-predictions/index.ts`
*   **Controller:** `packages/server/src/controllers/internal-predictions/index.ts` (Handler: `createInternalPrediction`)
*   **Service:** `packages/server/src/services/predictions/index.ts` (Method: `createInternalPrediction` which calls `runPrediction` with `isInternal=true`, `isSSE=false`)
*   **Entity:** `packages/server/src/database/entities/ChatFlow.ts` (for fetching the chatflow)
*   **Interfaces:** `IChatMessage` (for history), `ICommonObject` (for `overrideConfig`), `IFileUpload` (for `uploads`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/internal-predictions/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the Chatflow to execute.
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema (`application/json`):**
    *   `question` (string, required): The primary input/query for the chatflow.
    *   `overrideConfig?` (object, optional): Key-value pairs to override node configurations within the chatflow for this specific execution.
    *   `history?` (array of `IChatMessage` objects, optional): An array of previous chat messages to provide context.
    *   `chatId?` (string, optional): ID of the chat session. If not provided, a new one might be generated or handled by session management.
    *   `sessionId?` (string, optional): Specific session ID to use for memory persistence.
    *   `stopNodeId?` (string, optional): ID of a node at which the flow execution should stop prematurely.
    *   `uploads?` (array of `IFileUpload` objects, optional): Array of uploaded file details, if the flow uses file inputs.
        *   `IFileUpload`: `{ data: string (base64), type: string (mime-type), name: string, url?: string }`
*   **Example Request Body:**
    ```json
    {
      "question": "What is the capital of France?",
      "chatId": "some-internal-chat-id"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Prediction executed successfully. The response is the direct output of the executed chatflow, which can be any JSON structure (e.g., simple text, object with source documents, etc.).
    *   **Content (`application/json`):**
        *   Schema: `type: object` with `additionalProperties: true` (as the response structure is highly dynamic and depends on the specific chatflow design).
        *   *Example:* `{ "text": "The capital of France is Paris." }` or `{ "result": "Paris", "sourceDocuments": [...] }`
*   **`400 Bad Request`:** Malformed request body or invalid input based on chatflow requirements.
*   **`404 Not Found`:** Chatflow with the specified `id` not found.
*   **`500 Internal Server Error`:** Error during chatflow execution.

**Core Logic Summary:**
1. Controller receives `chatflowId` from path and prediction inputs from `req.body`.
2. Calls `predictionsService.createInternalPrediction(chatflowId, req.body, files, true, false)` (isInternal=true, isSSE=false).
3. `createInternalPrediction` in service retrieves the ChatFlow, sets up an `AbortController`, and calls `runPrediction`.
4. `runPrediction` (core execution logic):
    a. Initializes the chatflow graph with Langchain.
    b. Processes the input (`question`, `history`, `overrideConfig`, `uploads`).
    c. Executes the flow.
    d. Saves chat messages (`userMessage` and `apiMessage`) to the database.
    e. Returns the final prediction result from the flow.
