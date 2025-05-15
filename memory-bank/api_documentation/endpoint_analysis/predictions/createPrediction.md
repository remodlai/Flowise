# API Endpoint Analysis: `POST /predictions/{id}` or `POST /predictions/`

**Task ID:** `e91d9e76-99aa-4737-a23e-9603f163bb59`
**Module:** `predictions`
**Operation ID:** `createPrediction`
**Source Files:**
*   `packages/server/src/routes/predictions/index.ts`
*   `packages/server/src/controllers/predictions/index.ts`
*   `packages/server/src/services/predictions/index.ts`
*   `packages/server/src/utils/buildChatflow.ts`

## Endpoint Description

This endpoint is the primary mechanism for executing a deployed Flowise chatflow or agentflow via the API. It accepts user input (question, history, files, overrides) for a specific chatflow ID, processes it through the defined flow logic, and returns the result either as a single JSON response or a Server-Sent Events (SSE) stream.

**CRITICAL:** This is the main interaction point for external applications, UIs, and tools to leverage Flowise flows.

## Request Details

*   **Method:** `POST`
*   **Path:** 
    *   `/predictions/{id}` - Where ID is provided in the URL path
    *   `/predictions/` - Where ID is provided in the request body
*   **Middlewares:**
    *   File upload middleware (via `getMulterStorage().array('files')`)
    *   Rate limiter middleware (via `getRateLimiterMiddleware`)
*   **Path Parameters:**
    *   `id` (string, **required** if using path variant): The unique identifier of the chatflow/agentflow to execute. No specific format is enforced by the implementation, but typically uses UUID format.
*   **Content-Type:**
    *   `application/json`: For standard requests without file uploads.
    *   `multipart/form-data`: Required if uploading files directly via the API request.
*   **Request Body Schema:** `$ref: '../schemas/modules/PredictionsSchemas.yaml#/components/schemas/PredictionsRequestBody'`
    *   **Key Fields (JSON Body or Form-Data Fields):**
        *   `question` (string): The user's primary input/query.
        *   `overrideConfig` (object, optional): Allows overriding node parameters within the flow execution. Highly dynamic structure based on the target flow.
        *   `history` (array, optional): Array of previous `ChatMessage` objects for context.
        *   `streaming` (boolean, optional): If `true`, requests an SSE stream response. Default is `false`.
        *   `chatId` (string, optional): Existing chat session ID. If omitted, uses `overrideConfig.sessionId` or generates a new UUID.
        *   `leadEmail` (string, optional): For lead capture.
        *   `vars` (object, optional): Variable overrides (usually via form-data).
    *   **File Uploads (Form-Data Only):**
        *   Uses standard `multipart/form-data` encoding.
        *   Files are mapped to specific input fields based on MIME type/extension (e.g., a PDF might be mapped to `overrideConfig.pdfFile` internally with value `FILE-STORAGE::[...]`). Multiple files for the same input type are concatenated.
        *   The `uploads` field in the JSON schema definition is for chat-component uploads (data URIs) and is ignored if `multipart/form-data` is used.

## Response Details

*   **Success Response (Non-Streaming - `application/json`):**
    *   **Status Code:** `200 OK`
    *   **Schema:** `$ref: '../schemas/modules/PredictionsSchemas.yaml#/components/schemas/PredictionsSuccessResponse'`
    *   **Contains:** `text` (main response), `chatId`, `chatMessageId`, original `question`, `sessionId`, `memoryType`, and optional fields like `sourceDocuments`, `usedTools`, `artifacts`, `followUpPrompts`, `flowVariables`, `json`.
*   **Success Response (Streaming - `text/event-stream`):**
    *   **Status Code:** `200 OK`
    *   **Content-Type:** `text/event-stream`
    *   **SSE Headers:**
        *   `Content-Type: text/event-stream`
        *   `Cache-Control: no-cache`
        *   `Connection: keep-alive`
        *   `X-Accel-Buffering: no` (Prevents NGINX buffering)
    *   **Stream Format:** Each event follows the SSE format pattern:
        ```
        message
        data: {"event":"EVENT_TYPE","data":EVENT_DATA}
        ```

### Detailed SSE Event Types

The streaming response includes various event types, each providing different information about the chatflow execution:

#### Flow Control Events

1. **`start`** - Signals the beginning of the stream
   ```json
   {"event":"start","data":"Execution started"}
   ```

2. **`agentFlowEvent`** - Overall process status updates
   ```json
   {"event":"agentFlowEvent","data":"INPROGRESS"}
   {"event":"agentFlowEvent","data":"FINISHED"}
   ```
   * Possible statuses: `INPROGRESS`, `FINISHED`, `ERROR`, `TERMINATED`, `TIMEOUT`, `STOPPED`

3. **`end`** - Signals the end of the stream
   ```json
   {"event":"end","data":"[DONE]"}
   ```

4. **`abort`** - Signals that the execution was aborted
   ```json
   {"event":"abort","data":"[DONE]"}
   ```

5. **`error`** - Error information if execution fails
   ```json
   {"event":"error","data":"Error message details"}
   ```

#### Node Execution Events

1. **`nextAgentFlow`** - Node processing status updates
   ```json
   {"event":"nextAgentFlow","data":{"nodeId":"node_12345","nodeLabel":"LLM Node","status":"INPROGRESS"}}
   {"event":"nextAgentFlow","data":{"nodeId":"node_12345","nodeLabel":"LLM Node","status":"FINISHED"}}
   ```

2. **`agentFlowExecutedData`** - Detailed execution data from completed nodes
   ```json
   {"event":"agentFlowExecutedData","data":[{
     "nodeId":"node_12345",
     "nodeLabel":"LLM Node",
     "data":{"someOutput":"value"},
     "previousNodeIds":[],
     "status":"FINISHED"
   }]}
   ```

#### Content Events

1. **`token`** - Individual tokens from LLM streaming
   ```json
   {"event":"token","data":"Hello"}
   {"event":"token","data":" world"}
   ```

2. **`sourceDocuments`** - RAG source references
   ```json
   {"event":"sourceDocuments","data":[{
     "pageContent":"Document text",
     "metadata":{
       "source":"file.pdf",
       "page":5
     }
   }]}
   ```

3. **`artifacts`** - Generated artifacts like images or files
   ```json
   {"event":"artifacts","data":[{
     "name":"generated_image.png",
     "type":"base64",
     "data":"data:image/png;base64,..."
   }]}
   ```

4. **`fileAnnotations`** - File annotations, especially from OpenAI Assistants
   ```json
   {"event":"fileAnnotations","data":[{
     "fileId":"file_id",
     "text":"Annotation text",
     "startIndex":0,
     "endIndex":100
   }]}
   ```

#### Tool Usage Events

1. **`calledTools`** - Information about tools called during execution
   ```json
   {"event":"calledTools","data":[{
     "name":"calculator",
     "input":{"expression":"2+2"},
     "output":"4"
   }]}
   ```

2. **`usedTools`** - Similar to calledTools but with different formatting
   ```json
   {"event":"usedTools","data":[{
     "tool":"calculator",
     "toolInput":{"expression":"2+2"},
     "toolOutput":"4"
   }]}
   ```

3. **`tool`** - Detailed tool execution information
   ```json
   {"event":"tool","data":{
     "name":"calculator",
     "description":"Performs calculations",
     "parameters":{
       "expression":"2+2"
     },
     "result":"4"
   }}
   ```

4. **`action`** - Action information, especially from agent tools
   ```json
   {"event":"action","data":{
     "id":"action_123",
     "type":"web_search",
     "parameters":{
       "query":"Weather in New York"
     }
   }}
   ```

#### Agent Events

1. **`agentReasoning`** - Agent reasoning/thought process
   ```json
   {"event":"agentReasoning","data":"I need to find information about France. I'll search for 'capital of France'."}
   ```

2. **`nextAgent`** - Information about the next agent in multi-agent flows
   ```json
   {"event":"nextAgent","data":{
     "id":"agent_123",
     "name":"Research Agent",
     "description":"Performs research tasks"
   }}
   ```

#### Metadata Events

1. **`metadata`** - Session information and context
   ```json
   {"event":"metadata","data":{
     "chatId":"client-123456",
     "chatMessageId":"msg-789",
     "question":"What is the capital of France?",
     "sessionId":"sess-101112",
     "memoryType":"buffer",
     "followUpPrompts": ["Tell me more about Paris", "What is France known for?"],
     "flowVariables": {"detected_intent": "geography_question"}
   }}
   ```

2. **`usageMetadata`** - Token usage statistics
   ```json
   {"event":"usageMetadata","data":{
     "input_tokens": 156,
     "output_tokens": 42,
     "total_tokens": 198,
     "input_token_details": {
       "audio": 0,
       "cache_read": 0
     },
     "output_token_details": {
       "audio": 0,
       "reasoning": 0
     },
     "tool_call_tokens": 0
   }}
   ```

### Streaming Implementation Notes

* Not all chatflows support streaming; depends on node compatibility
* Custom Function ending nodes do not support streaming
* The `isStreamValid` property in the response indicates if streaming is supported
* Token streaming is only available for models that support it
* When in queue mode, streaming is handled via Redis pub/sub
* Clients should implement reconnection logic for robust streaming
* Event types will vary depending on the specific nodes in the flow

*   **Error Responses (`application/json`):**
    *   **Status Codes:** 
        *   `400 Bad Request`: Missing or invalid parameters
        *   `403 Forbidden`: Origin not allowed (based on chatbotConfig.allowedOrigins)
        *   `404 Not Found`: Chatflow not found
        *   `429 Too Many Requests`: Rate limit exceeded (via rate limiter middleware)
        *   `500 Internal Server Error`: Server processing error
    *   **Schema:** `$ref: '../schemas/shared/CommonSchemas.yaml#/components/schemas/ErrorResponse'`

## Processing Logic Summary

1.  Retrieves chatflow based on `{id}`.
2.  Validates API key (if external request).
3.  Checks domain origin against `chatbotConfig.allowedOrigins` (if configured).
4.  Applies rate limiting via the rate limiter middleware.
5.  Processes `req.body` (`incomingInput`) and `req.files` (form-data uploads).
6.  Stores uploaded files (if any) and potentially performs speech-to-text.
7.  Determines `chatId` and `sessionId`.
8.  Loads chat history based on memory node configuration.
9.  Builds the execution graph, applying overrides from `overrideConfig` and `vars`.
10. Executes the flow node by node.
11. If `streaming` is true and flow is streamable, uses SSE; otherwise, collects the full result.
12. Handles potential post-processing.
13. Saves user and API messages to the database.
14. Formats and returns the final JSON response or streams SSE events.

## Security & Authorization

*   **API Key:** Required for external requests, validated against the chatflow's configuration.
*   **Domain Origin Control:** Can restrict access based on `chatbotConfig.allowedOrigins`.
*   **Rate Limiting:** Applied globally or per-chatflow based on configuration via the rate limiter middleware.