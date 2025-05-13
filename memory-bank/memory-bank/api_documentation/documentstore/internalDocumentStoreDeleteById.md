# Endpoint Analysis: DELETE /api/v1/document-stores/store/{id}

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreDeleteById`
**Description:** Deletes a document store and all its associated data, including file chunks, stored files, and upsert history.

**Key Files:**
*   **Router:** `packages/server/src/routes/documentstore/index.ts`
*   **Controller:** `packages/server/src/controllers/documentstore/index.ts` (Handler: `deleteDocumentStore`)
*   **Service:** `packages/server/src/services/documentstore/index.ts` (Method: `deleteDocumentStore`)
*   **Entities:** `DocumentStore.ts`, `DocumentStoreFileChunk.ts`, `UpsertHistory.ts`
*   **Utility:** `removeFilesFromStorage` from `flowise-components`

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `DELETE`
*   **Path:** `/api/v1/document-stores/store/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the document store to delete.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Document store and associated data deleted successfully.
    *   **Content (`application/json`):** Schema: `{ deleted: number }` (where `deleted` is usually 1 if successful).
*   **`404 Not Found`:**
    *   **Description:** `DocumentStore` with the specified `id` not found (checked before attempting file/chunk deletion).
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (path parameter) not provided.
*   **`500 Internal Server Error`:**
    *   **Description:** Error during database operations or file system cleanup.

**Core Logic Summary:**
1. Controller validates `req.params.id`.
2. Calls service `deleteDocumentStore(id)`.
3. Service:
    a. Deletes all `DocumentStoreFileChunk` entities associated with `storeId`.
    b. Fetches the `DocumentStore` entity (throws 404 if not found).
    c. Calls `removeFilesFromStorage(DOCUMENT_STORE_BASE_FOLDER, entity.id)` to delete stored files.
    d. Deletes all `UpsertHistory` entries for this `storeId` (as `chatflowid`).
    e. Deletes the `DocumentStore` entity itself.
    f. Returns an object like `{ deleted: 1 }` if the main entity deletion was successful.
