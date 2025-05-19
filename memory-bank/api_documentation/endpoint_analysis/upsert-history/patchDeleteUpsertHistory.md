# Endpoint Analysis: PATCH /api/v1/upsert-history/

**Module:** `upsert-history`
**Operation ID:** `patchDeleteUpsertHistory`
**Description:** Deletes specified upsert history records by their IDs.

**Key Files:**
*   **Router:** `packages/server/src/routes/upsert-history/index.ts`
*   **Controller:** `packages/server/src/controllers/upsert-history/index.ts` (Handler: `patchDeleteUpsertHistory`)
*   **Service:** `packages/server/src/services/upsert-history/index.ts` (Method: `patchDeleteUpsertHistory`)
*   **Entity:** `packages/server/src/database/entities/UpsertHistory.ts`
*   **Interface:** `packages/server/src/Interface.ts` (Interface: `IUpsertHistory`)

**Authentication:** Requires API Key (`ApiKeyAuth`).

**Request:**
*   **Method:** `PATCH` 
*   **Path:** `/api/v1/upsert-history/`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    *   `ids` (array of string, format: uuid, required, minItems: 1): An array of `UpsertHistory` record IDs to delete.
    *   Example: `{ "ids": ["123e4567-e89b-12d3-a456-426614174000", "98765432-e89b-12d3-a456-426614174000"] }`

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Upsert history records deleted successfully.
    *   **Content (`application/json`):** TypeORM `DeleteResult` object.
        *   `raw` (array): Raw database response (typically empty for successful deletes).
        *   `affected` (integer): Number of records that were successfully deleted.
        *   Example: `{ "raw": [], "affected": 2 }`

*   **`500 Internal Server Error`:**
    *   **Description:** Database error or other server-side issue.
    *   **Content (`application/json`):** Standard error response object.

**Core Logic Summary:**
1. Controller extracts array of `ids` from `req.body.ids`, defaulting to an empty array if no IDs are provided.
2. Controller calls `upsertHistoryService.patchDeleteUpsertHistory(ids)`.
3. Service uses TypeORM's `delete` method on the `UpsertHistory` repository, passing the array of IDs.
4. TypeORM generates and executes a DELETE query with a WHERE clause that matches any ID in the provided array.
5. Service returns the TypeORM `DeleteResult` object which contains information about the operation.
6. Controller sends the `DeleteResult` as a JSON response.

**Implementation Notes:**
- The endpoint uses HTTP PATCH method, which is unconventional for delete operations (typically DELETE would be used).
- The controller handles the case of no IDs being provided by defaulting to an empty array, which would result in 0 affected rows.
- No validation is performed on the UUIDs before attempting deletion, relying on the database to handle invalid IDs.
- This is a bulk operation that can delete multiple records in a single request, which is more efficient than making separate requests.
- The endpoint does not verify that the IDs exist before attempting deletion - if an ID doesn't exist, it simply won't be counted in the affected rows.
- There's no authentication check to ensure the requestor has permission to delete these specific records, beyond the API key requirement.
- The service does not perform a soft delete - records are permanently removed from the database.
