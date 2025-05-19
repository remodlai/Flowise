# Endpoint Analysis: GET /api/v1/upsert-history/{id} (and /)

**Module:** `upsert-history`
**Operation ID:** `getAllUpsertHistory`
**Description:** Retrieves the history of upsert operations for a specific `chatflowid` (which typically corresponds to a Document Store ID in this context). Allows filtering by date range and sorting. The `result` and `flowData` fields are parsed from JSON strings into objects.

**Key Files:**
*   **Router:** `packages/server/src/routes/upsert-history/index.ts`
*   **Controller:** `packages/server/src/controllers/upsert-history/index.ts` (Handler: `getAllUpsertHistory`)
*   **Service:** `packages/server/src/services/upsert-history/index.ts` (Method: `getAllUpsertHistory`)
*   **Entity:** `packages/server/src/database/entities/UpsertHistory.ts`
*   **Interface:** `packages/server/src/Interface.ts` (Interface: `IUpsertHistory`)

**Authentication:** Requires API Key (`ApiKeyAuth`).

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/upsert-history/{id}` or `/api/v1/upsert-history/`
*   **Path Parameters:**
    *   `id` (string, format: uuid, optional): ID of the Chatflow/DocumentStore to filter history for.
*   **Query Parameters (optional):**
    *   `sortOrder` (string, enum: `ASC`, `DESC`, default: `ASC`): Sort order for results by `date`.
    *   `startDate` (string, format: date-time): Filter records on or after this date (ISO8601 format).
    *   `endDate` (string, format: date-time): Filter records on or before this date (ISO8601 format).

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved upsert history records.
    *   **Content (`application/json`):** Array of `UpsertHistory` objects with parsed JSON fields.
        *   Each object includes: `id`, `chatflowid`, `result` (parsed JSON), `flowData` (parsed JSON), and `date`

*   **`500 Internal Server Error`:**
    *   **Description:** Database error or other server-side issue.
    *   **Content (`application/json`):** Standard error response object.

**Core Logic Summary:**
1. Router registers both `/` and `/:id` paths to the same controller method.
2. Controller extracts query parameters: `sortOrder` from `req.query.order`, `chatflowid` from `req.params.id`, and date filters.
3. Controller calls `upsertHistoryService.getAllUpsertHistory(sortOrder, chatflowid, startDate, endDate)`.
4. Service builds a database query with optional filters:
   - If both `startDate` and `endDate` are provided, it uses TypeORM's `Between` operator
   - If only `startDate` is provided, it uses `MoreThanOrEqual` operator
   - If only `endDate` is provided, it uses `LessThanOrEqual` operator 
   - If `chatflowid` is provided, it adds a filter for that specific ID
5. Service orders the results by `date` field according to the `sortOrder` parameter.
6. For each record retrieved, it parses the `result` and `flowData` JSON string fields into JavaScript objects.
7. Service returns an array of these processed `UpsertHistory` objects.
8. Controller sends the response as JSON.

**Implementation Notes:**
- Unlike many other endpoints, this one allows the path parameter `id` to be optional - if not provided, it will fetch records across all chatflows/document stores.
- The controller parameter `sortOrder` corresponds to `req.query.order` in the implementation but is documented as `sortOrder` in the OpenAPI specification.
- The TypeORM query uses conditional logic to build different date filter conditions based on which parameters are provided.
- The `result` and `flowData` fields are stored as JSON strings in the database but are parsed into objects before being returned to the client.
- This endpoint is primarily used by the DocumentStore UI to display upsert operation history.
- This is a read-only endpoint with no side effects, making it safe for frequent polling or automated monitoring.
- If no filters are provided and no ID is specified, it will return all upsert history records in the database. 