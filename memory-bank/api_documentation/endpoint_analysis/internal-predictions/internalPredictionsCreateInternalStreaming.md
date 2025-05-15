# Endpoint Analysis: POST /api/v1/internal-predictions/{id} (Streaming)

**Module:** `internal-predictions`

**Operation ID:** `internalPredictionsCreateInternalStreaming`

**Description:** Executes a chatflow identified by `:id` for internal, streaming predictions. This endpoint provides a server-sent events (SSE) stream of the chatflow execution progress and results. This is suitable for real-time UIs and internal tools that need to show incremental results as they become available.

## Implementation Details

**Key Files:**
*   **Router:** `packages/server/src/routes/internal-predictions/index.ts`
*   **Controller:** `packages/server/src/controllers/internal-predictions/index.ts` (Handler: `createInternalPrediction` -> `createAndStreamInternalPrediction`)
*   **SSE Utilities:** `packages/server/src/utils/SSEStreamer.ts` (Handles event streaming)
*   **Flow Execution:** `packages/server/src/utils/buildChatflow.ts` (Core execution logic)
*   **Entity:** `packages/server/src/database/entities/ChatFlow.ts` (for fetching the chatflow)

**Authentication:** Requires API Key.

**Execution Modes:**
* **Standard Mode:** Direct execution on the server
* **Queue Mode:** When `process.env.MODE === 'QUEUE'`, execution is handled by a worker queue for better scalability and reliability
  * Uses Redis for coordinating streaming events between workers and API server
  * All streaming events are published to a Redis channel keyed by `chatId`

## Request

*   **Method:** `POST`
*   **Path:** `/api/v1/internal-predictions/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): The ID of the Chatflow to execute.
*   **Headers:** 
    *   `Content-Type: application/json`
    *   `Accept: text/event-stream`
    *   `Authorization: Bearer YOUR_API_KEY` or `X-Api-Key: YOUR_API_KEY`
*   **Request Body Schema (`application/json`):**
    *   `streaming` (boolean, required): Must be set to `true` to enable streaming.
    *   `question` (string, required): The primary input/query for the chatflow.
    *   `chatId` (string, required): ID of the chat session. Required for streaming to identify the client.
    *   `overrideConfig?` (object, optional): Key-value pairs to override node configurations.
    *   `history?` (array of message objects, optional): An array of previous chat messages.
    *   `sessionId?` (string, optional): Specific session ID to use for memory.
    *   `stopNodeId?` (string, optional): ID of a node at which to stop execution.
    *   `uploads?` (array of upload objects, optional): Array of uploaded file details.
    *   `leadEmail?` (string, optional): Optional email for lead tracking.
*   **Example Request Body:**
    ```json
    {
      "streaming": true,
      "question": "What is the capital of France?",
      "chatId": "client-123456",
      "history": [
        {"type": "human", "message": "Who are you?"},
        {"type": "ai", "message": "I am a virtual assistant."}
      ]
    }
    ```

## Response

*   **Content Type:** `text/event-stream`
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

## Event Types in Detail

The streaming response consists of various event types, each conveying different aspects of the chatflow execution process. Event types can be broadly categorized:

### Flow Control Events

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
   * Note: Error messages from API keys are sanitized to prevent sensitive data leakage

### Node Execution Events

1. **`nextAgentFlow`** - Node processing status updates
   ```json
   {"event":"nextAgentFlow","data":{"nodeId":"node_12345","nodeLabel":"LLM Node","status":"INPROGRESS"}}
   {"event":"nextAgentFlow","data":{"nodeId":"node_12345","nodeLabel":"LLM Node","status":"FINISHED"}}
   ```
   * Shows when execution moves to a node and when that node completes
   * Essential for UI progress indication

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
   * Contains the actual output data produced by nodes
   * May include intermediate results used in subsequent nodes

### Content Events

1. **`token`** - Individual tokens from an LLM
   ```json
   {"event":"token","data":"Hello"}
   {"event":"token","data":" world"}
   ```
   * Only emitted for models that support token streaming
   * Each event contains a single chunk of text, not a complete response

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
   * Contains documents retrieved by retrieval nodes
   * Format depends on the specific retriever/vector store implementation

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

### Tool Usage Events

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

### Agent Events

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

### Metadata Events

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
   * Sent at the end of successful execution
   * Contains important identifiers and session information

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
   * Used for token accounting and usage tracking
   * Particularly important for APIs with token-based billing

## Technical Implementation Notes

1. **Stream Management**
   * Client connections are managed by `SSEStreamer` class
   * Each client is identified by its `chatId`
   * Connections are kept open until explicitly ended or error occurs

2. **Streaming Validity**
   * Not all chatflows can be streamed; depends on node compatibility
   * Custom Function ending nodes do not support streaming
   * Response includes `isStreamValid: false` if streaming isn't supported

3. **Redis Queue Mode**
   * When `process.env.MODE === 'QUEUE'`, execution is offloaded to workers
   * The API server subscribes to Redis channel matching the `chatId`
   * Workers publish events to this Redis channel
   * Ensures load distribution without sacrificing streaming capabilities

4. **Error Handling**
   * If an error occurs during execution, an `error` event is sent
   * The connection is then gracefully closed
   * All API keys in error messages are sanitized for security

5. **Resource Cleanup**
   * The client is removed from SSEStreamer after completion
   * AbortController is removed from pool to prevent memory leaks
   * Redis subscriptions are cleaned up in queue mode

## Client-Side Implementation Guidelines

1. **Connection Establishment**
   * Use `EventSource` or similar for SSE connection
   * Set appropriate headers including Authorization
   * Prepare for reconnection if connection drops

2. **Event Parsing**
   * Parse each event's data as JSON
   * Handle different event types appropriately
   * Buffer token events to build the complete response

3. **Error Handling**
   * Listen for error events
   * Implement reconnection strategy with backoff
   * Handle unexpected connection termination

4. **Example Client Implementation**
   ```javascript
   const eventSource = new EventSource('/api/v1/internal-predictions/id', {
     headers: { 'Authorization': 'Bearer api_key' }
   });
   
   let responseText = '';
   
   eventSource.addEventListener('message', (event) => {
     const parsedData = JSON.parse(event.data);
     
     switch(parsedData.event) {
       case 'token':
         responseText += parsedData.data;
         break;
       case 'error':
         console.error('Error:', parsedData.data);
         eventSource.close();
         break;
       case 'end':
         eventSource.close();
         break;
     }
   });
   ```

## Edge Cases and Limitations

1. **Flow Compatibility**
   * Not all nodes support streaming (e.g., Custom Function nodes)
   * Post-processing settings disable streaming capability
   * Check `isStreamValid` in metadata to confirm streaming support

2. **Connection Management**
   * Long-running flows may exceed client timeout limits
   * Implement client-side reconnection logic for robustness
   * Some proxy servers may buffer responses unless configured correctly

3. **Event Order**
   * Events are not guaranteed to arrive in a consistent order
   * Clients should be prepared to handle out-of-order events
   * Token events should always be processed sequentially

4. **Resource Limits**
   * Large files in sourceDocuments may be truncated
   * Extremely long-running flows may encounter timeout limits
   * Error events do not contain full stack traces in production 