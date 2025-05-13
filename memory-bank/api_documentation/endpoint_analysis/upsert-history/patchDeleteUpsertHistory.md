# Endpoint Analysis: PATCH /api/v1/upsert-history/

**Module:** `upsert-history`
**Operation ID:** `patchDeleteUpsertHistory`
**Description:** Deletes specified upsert history records by their IDs.

**Key Files:**
*   Router: `packages/server/src/routes/upsert-history/index.ts`
*   Controller: `packages/server/src/controllers/upsert-history/index.ts` (Handler: `patchDeleteUpsertHistory`)
*   Service: `packages/server/src/services/upsert-history/index.ts` (Method: `patchDeleteUpsertHistory`)
*   Entity: `packages/server/src/database/entities/UpsertHistory.ts`
*   Schema File: `api_documentation/schemas/modules/UpsertHistorySchemas.yaml` (for request body)
*   Shared Schema: `api_documentation/schemas/shared/CommonSchemas.yaml` (for `DeleteResultSchema` if it's moved there or defined inline)

**Authentication:** Requires API Key.

**Request:**
*   Method: `PATCH` (Note: HTTP PATCH is typically for partial updates, but here it's used for a bulk delete operation specified in the body. A `DELETE` method with IDs in the body or query might also be conventional, but the API uses `PATCH`.)
*   Path: `/api/v1/upsert-history/`
*   Headers: `Content-Type: application/json`
*   **Request Body Schema:** `$ref: '../../schemas/modules/UpsertHistorySchemas.yaml#/components/schemas/PatchDeleteUpsertHistoryRequestSchema'`
    *   `ids` (array of string, format: uuid, required, minItems: 1): An array of `UpsertHistory` record IDs to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Upsert history records deleted successfully.
    *   Content (`application/json`): Schema based on TypeORM `DeleteResult` (e.g., `{ raw: [], affected: number }`).
        *   Example: `{ "raw": [], "affected": 3 }`
*   **`500 Internal Server Error`:** Database error or other server-side issue.

**Core Logic Summary:**
1. Controller receives an array of `ids` from `req.body.ids` (defaults to empty array if `ids` is not provided, which would result in 0 affected rows).
2. Calls `upsertHistoryService.patchDeleteUpsertHistory(ids)`.
3. Service uses TypeORM to delete `UpsertHistory` records where the `id` is in the provided `ids` array.
4. Returns the `DeleteResult` object from TypeORM.
