# Endpoint Analysis: GET /api/v1/stats/{id}

**Module:** `stats`
**Operation ID:** `getChatflowStats`
**Description:** Retrieves statistics for a specific chatflow, including total messages, total feedback count, and positive feedback count, based on optional filters.

**Key Files:**
*   **Router:** `packages/server/src/routes/stats/index.ts`
*   **Controller:** `packages/server/src/controllers/stats/index.ts` (Handler: `getChatflowStats`)
*   **Service:** `packages/server/src/services/stats/index.ts` (Method: `getChatflowStats`)
*   **Utility:** `packages/server/src/utils/getChatMessage.ts`
*   **Entity:** `packages/server/src/database/entities/ChatMessage.ts`
*   **Entity:** `packages/server/src/database/entities/ChatMessageFeedback.ts`

**Authentication:** Requires API Key (`ApiKeyAuth`).

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/stats/{id}` or `/api/v1/stats/`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the Chatflow.
*   **Query Parameters (optional):**
    *   `chatType` (string or array of string): Filter by `ChatType` enum values (e.g., "INTERNAL", "EXTERNAL").
    *   `startDate` (string, format: date-time): Filter messages from this date (ISO8601 format).
    *   `endDate` (string, format: date-time): Filter messages up to this date (ISO8601 format).
    *   `feedbackType` (string or array of string): Filter by `ChatMessageRatingType` enum values (e.g., "THUMBS_UP", "THUMBS_DOWN").

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved chatflow statistics.
    *   **Content (`application/json`):** Schema: `$ref: '../../schemas/modules/StatsSchemas.yaml#/components/schemas/ChatflowStatsResponse'`
        *   `totalMessages` (integer): Total number of messages for the chatflow matching the filters.
        *   `totalFeedback` (integer): Total number of messages with feedback for the chatflow matching the filters.
        *   `positiveFeedback` (integer): Total number of messages with positive (THUMBS_UP) feedback for the chatflow matching the filters.

*   **`412 Precondition Failed`:**
    *   **Description:** No chatflow ID provided or ID missing in request parameters.
    *   **Content (`application/json`):** Standard error response object.

*   **`500 Internal Server Error`:**
    *   **Description:** Database error or processing error in the service.
    *   **Content (`application/json`):** Standard error response object.

**Core Logic Summary:**
1. Router registers both `/` and `/:id` paths to the same controller method.
2. Controller validates that an ID parameter is present in the request, throwing a 412 error if missing.
3. Controller processes the optional query parameters:
   - Parses `chatType` parameter which can be a string, JSON array, or direct array
   - Handles `startDate` and `endDate` as string parameters in ISO8601 format
   - Processes `feedbackType` parameter which requires special handling; the controller attempts to parse JSON and determine if THUMBS_UP, THUMBS_DOWN, or both are selected
4. Controller calls `statsService.getChatflowStats` with processed parameters.
5. Service uses `utilGetChatMessage` utility to fetch relevant messages based on the filters.
6. Service calculates three metrics from the fetched messages:
   - `totalMessages`: Count of all messages matching the filters
   - `totalFeedback`: Count of messages that have associated feedback
   - `positiveFeedback`: Count of messages with THUMBS_UP rating
7. Service returns these statistics as a JSON object.

**Implementation Notes:**
- The controller explicitly checks for the presence of `req.params.id` and throws a 412 Precondition Failed error if not provided.
- The `feedbackType` parameter supports multiple formats (single string, array of strings, or JSON string), and the controller includes logic to normalize these variations.
- When both THUMBS_UP and THUMBS_DOWN are specified in `feedbackType`, the controller properly handles this to include all feedback.
- The service implementation uses the utility function `utilGetChatMessage` which performs the actual database queries.
- The query results are processed in memory to calculate the statistics rather than using database aggregation.
- The router registers both `/` and `/:id` paths to the same controller method, but the controller implementation requires an ID parameter, so the root path will always return a 412 error. 