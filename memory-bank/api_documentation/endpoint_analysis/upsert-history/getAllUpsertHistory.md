# Endpoint Analysis: GET /api/v1/upsert-history/{id} (and /)

**Module:** `upsert-history`
**Operation ID:** `getAllUpsertHistory`
**Description:** Retrieves the history of upsert operations for a specific `chatflowid` (which typically corresponds to a Document Store ID in this context). Allows filtering by date range and sorting. The `result` and `flowData` fields are parsed from JSON strings into objects.

**Key Files:**
*   Router: `packages/server/src/routes/upsert-history/index.ts`
*   Controller: `packages/server/src/controllers/upsert-history/index.ts` (Handler: `getAllUpsertHistory`)
*   Service: `packages/server/src/services/upsert-history/index.ts` (Method: `getAllUpsertHistory`)
*   Entity: `packages/server/src/database/entities/UpsertHistory.ts`
*   Schema File: `api_documentation/schemas/modules/UpsertHistorySchemas.yaml`

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/upsert-history/{id}` (Controller uses `req.params.id` as `chatflowid`)
    *   The path `/api/v1/upsert-history/` (without an ID) is also routed here. If no `id` is in path, `chatflowid` filter in service will be undefined, potentially fetching all history across all chatflows/document stores if not further restricted by other query params.
*   **Path Parameters:**
    *   `id` (string, format: uuid, optional): ID of the Chatflow/DocumentStore to filter history for.
*   **Query Parameters (optional):**
    *   `sortOrder` (string, enum: `ASC`, `DESC`, default: `ASC`): Sort order for results by `date`.
    *   `startDate` (string, format: date-time): Filter records on or after this date.
    *   `endDate` (string, format: date-time): Filter records on or before this date.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved upsert history records.
    *   Content (`application/json`): Array of `UpsertHistoryResponseItemSchema` objects.
*   **`500 Internal Server Error`:** Database error or other server-side issue.

**Core Logic Summary:**
1. Controller receives `chatflowid` (from `req.params.id`) and optional query filters (`sortOrder`, `startDate`, `endDate`).
2. Calls `upsertHistoryService.getAllUpsertHistory(sortOrder, chatflowid, startDate, endDate)`.
3. Service queries the `UpsertHistory` table, applying filters for `chatflowid` and date range. Orders by `date`.
4. For each record retrieved, it parses the `result` and `flowData` JSON string fields into objects.
5. Returns an array of these processed `UpsertHistory` objects. 