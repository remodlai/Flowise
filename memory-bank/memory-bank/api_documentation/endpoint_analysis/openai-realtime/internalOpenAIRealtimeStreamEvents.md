# Endpoint Analysis: GET /api/v1/openai-realtime/{threadId}/{runId}

**Module:** `openai-realtime`
**Operation ID:** `internalOpenAIRealtimeStreamEvents`
**Description:** Establishes a Server-Sent Event (SSE) stream for real-time updates from an OpenAI Assistant run. Clients connect to this endpoint to receive events as they happen during the run's execution.

**Key Files:**
*   Router: `routes/openai-realtime/index.ts`
*   Controller: `controllers/openai-realtime/index.ts` (Handler: `handleOpenAIStream`)
*   Service: `services/openai-realtime/index.ts` (Method: `handleOpenAIStream`)
*   External: OpenAI SDK (`openai.beta.threads.runs.stream`)

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/openai-realtime/{threadId}/{runId}`
*   **Path Parameters:**
    *   `threadId` (string, required): The ID of the OpenAI Assistant thread.
    *   `runId` (string, required): The ID of the specific run within the thread.

**Responses:**

*   **`200 OK` (Success - Stream Established):**
    *   Description: Server-Sent Event stream initiated.
    *   Content-Type: `text/event-stream`
    *   **SSE Events:** The stream will send events as they are emitted by the OpenAI Assistants API. Common event types include:
        *   `event: thread.created` - Data: OpenAI Thread object
        *   `event: thread.run.created` - Data: OpenAI Run object
        *   `event: thread.run.queued` - Data: OpenAI Run object
        *   `event: thread.run.in_progress` - Data: OpenAI Run object
        *   `event: thread.run.requires_action` - Data: OpenAI Run object (with `required_action` details)
        *   `event: thread.run.completed` - Data: OpenAI Run object
        *   `event: thread.run.failed` - Data: OpenAI Run object (with `last_error`)
        *   `event: thread.run.cancelling` - Data: OpenAI Run object
        *   `event: thread.run.cancelled` - Data: OpenAI Run object
        *   `event: thread.run.expired` - Data: OpenAI Run object
        *   `event: thread.run.step.created` - Data: OpenAI RunStep object
        *   `event: thread.run.step.in_progress` - Data: OpenAI RunStep object
        *   `event: thread.run.step.delta` - Data: OpenAI RunStepDelta object (contains `delta.step_details`)
        *   `event: thread.run.step.completed` - Data: OpenAI RunStep object
        *   `event: thread.run.step.failed` - Data: OpenAI RunStep object
        *   `event: thread.run.step.cancelled` - Data: OpenAI RunStep object
        *   `event: thread.run.step.expired` - Data: OpenAI RunStep object
        *   `event: thread.message.created` - Data: OpenAI Message object
        *   `event: thread.message.in_progress` - Data: OpenAI Message object
        *   `event: thread.message.delta` - Data: OpenAI MessageDelta object (contains `delta.content`)
        *   `event: thread.message.completed` - Data: OpenAI Message object
        *   `event: thread.message.incomplete` - Data: OpenAI Message object
        *   `event: error` - Data: Error object from OpenAI or stream handling.
        *   `event: done` - Custom event from service indicating stream end. Data: `"[DONE]"`
    *   The `data` field for each event will be a JSON string of the corresponding OpenAI object.
*   **`401 Unauthorized`:** If credential for OpenAI API is missing or invalid.
*   **`404 Not Found`:** Thread or Run not found on OpenAI.
*   **`500 Internal Server Error`:** Error establishing stream or interacting with OpenAI.

**Core Logic Summary:**
1. Controller validates `threadId` and `runId`. Retrieves OpenAI API key credential.
2. Calls service `handleOpenAIStream(threadId, runId, openai, res)`.
3. Service sets up SSE headers on the `res` object.
4. Calls `openai.beta.threads.runs.stream(threadId, runId)` to get an event stream from OpenAI.
5. Iterates through events from the OpenAI stream:
    a. For each OpenAI event, writes `event: [event_name]\ndata: [json_payload]\n\n` to the HTTP response.
    b. Handles stream errors and completion, sending a final `event: done` message.
