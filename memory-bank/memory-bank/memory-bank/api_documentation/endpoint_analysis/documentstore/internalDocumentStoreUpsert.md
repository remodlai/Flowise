# Endpoint Analysis: POST /api/v1/document-stores/upsert (and /upsert/{id})

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreUpsert`
**Description:** Upserts documents to a document store. This involves uploading files (via multipart/form-data), processing them through configured or overridden loaders and splitters, saving chunks, and then upserting these chunks into the configured vector store. The operation can be queued if `process.env.MODE === 'queue'`. The `:id` in the path is the `storeId`.

**Key Files:**
* Router: `routes/documentstore/index.ts` (uses `getMulterStorage().array('files')` middleware)
* Controller: `controllers/documentstore/index.ts` (Handler: `upsertDocStoreMiddleware`)
* Service: `services/documentstore/index.ts` (Methods: `upsertDocStoreMiddleware`, `executeDocStoreUpsert`, `_saveChunksToStorage`, `_insertIntoVectorStoreWorkerThread`, and helpers)
* Entities: `DocumentStore.ts`, `DocumentStoreFileChunk.ts`, `UpsertHistory.ts`
* Interface: `Interface.DocumentStore.ts` (for `IDocumentStoreUpsertData`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `POST`
*   **Path:** `/api/v1/document-stores/upsert/{id}` or `/api/v1/document-stores/upsert/` (Controller uses `req.params.id` as `storeId` if present, otherwise expects `storeId` in form data)
*   **Headers:** `Content-Type: multipart/form-data`
*   **Path Parameters (if `/upsert/{id}` used):**
    *   `id` (string, format: uuid, optional): The ID of the Document Store.
*   **Form Data Fields:**
    *   `files` (array of File, optional): Files to upload and process.
    *   `storeId` (string, format: uuid, required if `:id` not in path): The ID of the Document Store.
    *   `docId?` (string, optional): ID of a specific loader configuration within the store to use/update. This refers to an entry in the `loaders` array of the DocumentStore entity.
    *   `metadata?` (string, optional): JSON string of a metadata object to apply to all documents in this upsert (e.g., `'{"source":"manual_upload"}'`).
    *   `replaceExisting?` (string 'true'/'false', optional): Whether to replace existing documents/chunks.
    *   `loader?` (string, optional): JSON string of loader configuration object (e.g., `'{"name":"cheerioWebScraper", "config":{"url":"http://example.com"}}'`).
    *   `splitter?` (string, optional): JSON string of splitter configuration object (e.g., `'{"name":"recursiveCharacterTextSplitter", "config":{"chunkSize":500}}'`).
    *   `vectorStore?` (string, optional): JSON string of vector store node configuration to override the store's existing one for this upsert.
    *   `embedding?` (string, optional): JSON string of embedding node configuration to override.
    *   `recordManager?` (string, optional): JSON string of record manager node configuration to override.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Upsert process initiated successfully. If not queued, returns result of vector store upsert. If queued, might return a job ID.
    *   **Content (`application/json`):** Schema varies. Example: `{ "result": "Successfully Upserted", "jobId": "queue-job-id" (if queued) }`. May include other details from vector store operation.
*   **`400 Bad Request` / `412 Precondition Failed`:**
    *   **Description:** Missing `storeId` (if not in path), other required data, or malformed JSON in stringified fields.
*   **`404 Not Found`:**
    *   **Description:** `DocumentStore` with the specified `storeId` not found.
*   **`500 Internal Server Error`:**
    *   **Description:** Error during file processing, chunking, vector store interaction, or queuing.

**Core Logic Summary:**
1. Controller receives `storeId`, other form data (`req.body`), and `req.files`.
2. Calls service `upsertDocStoreMiddleware(storeId, body, files)`.
3. Service prepares data for `executeDocStoreUpsert` (parsing JSON strings from form fields into objects for `IDocumentStoreUpsertData` structure).
4. If queued mode, adds job to 'upsert' queue. Else, calls `executeDocStoreUpsert` directly.
5. `executeDocStoreUpsert` coordinates file saving (via `_saveFileToStorage` which is part of `_saveChunksToStorage`), chunking (via `previewChunks` which uses `_splitIntoChunks`), saving chunks to `DocumentStoreFileChunk` DB, and finally upserting to the vector store (via `_insertIntoVectorStoreWorkerThread`).
6. `_insertIntoVectorStoreWorkerThread` builds embedding, vector store, and record manager instances based on the DocumentStore's config or overrides, then performs the upsert, saves `UpsertHistory`, and updates `DocumentStore` status.
