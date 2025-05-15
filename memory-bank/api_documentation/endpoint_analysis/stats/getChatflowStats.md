# Endpoint Analysis: GET /api/v1/stats/{id}

**Module:** `stats`
**Operation ID:** `getChatflowStats`
**Description:** Retrieves statistics for a specific chatflow, including total messages, total feedback count, and positive feedback count, based on optional filters.

**Key Files:**
*   Router: `packages/server/src/routes/stats/index.ts`
*   Controller: `packages/server/src/controllers/stats/index.ts` (Handler: `getChatflowStats`)
*   Service: `packages/server/src/services/stats/index.ts` (Method: `getChatflowStats`)
*   Utility: `packages/server/src/utils/getChatMessage.ts`
*   Schema File: `api_documentation/schemas/modules/StatsSchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/stats/{id}` (where `id` is `chatflowid`)
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the Chatflow.
*   **Query Parameters (optional):**
    *   `chatType` (string or array of string): Filter by `ChatType` (e.g., "INTERNAL", "EXTERNAL").
    *   `startDate` (string, format: date-time): Filter messages from this date.
    *   `endDate` (string, format: date-time): Filter messages up to this date.
    *   `feedbackType` (string or array of string): Filter by `ChatMessageRatingType` (e.g., "THUMBS_UP", "THUMBS_DOWN"). If provided, `feedback=true` is implied in service.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved chatflow statistics.
    *   Content (`application/json`): Schema `$ref: '../../schemas/modules/StatsSchemas.yaml#/components/schemas/ChatflowStatsResponse'`.
*   **`412 Precondition Failed`:** `id` (chatflowid) not provided.
*   **`500 Internal Server Error`:** Database or processing error.

**Core Logic Summary:**
1. Controller receives `chatflowid` and optional filters.
2. Controller processes the optional query parameters:
   - Parses `chatType` which can be a string, JSON array, or direct array
   - Handles `startDate` and `endDate` as string parameters
   - Processes `feedbackType` which requires special handling; the controller attempts to parse JSON and determine if THUMBS_UP, THUMBS_DOWN, or both are selected
3. Calls `statsService.getChatflowStats` with these parameters.
4. Service calls `utilGetChatMessage` to fetch relevant messages based on filters (implicitly setting `feedback=true` if `feedbackTypes` are present).
5. Service calculates `totalMessages`, `totalFeedback`, `positiveFeedback` from the fetched messages.
6. Returns these stats as a JSON object.

**Additional Notes:**
- The router also supports the path `/api/v1/stats/` (without an ID parameter), which maps to the same controller method. This will result in a 412 Precondition Failed error as the controller requires an ID parameter.
- The `feedbackType` parameter can be provided in different formats (single string, array of strings, or JSON), and the controller includes logic to normalize these variations. 