# Endpoint Analysis: GET /api/v1/document-stores/store

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreGetAll`
**Description:** Retrieves a list of all configured document stores.

**Key Files:**
*   **Router:** `packages/server/src/routes/documentstore/index.ts`
*   **Controller:** `packages/server/src/controllers/documentstore/index.ts` (Handler: `getAllDocumentStores`)
*   **Service:** `packages/server/src/services/documentstore/index.ts` (Method: `getAllDocumentStores`)
*   **Entity:** `packages/server/src/database/entities/DocumentStore.ts`
*   **DTO Definition:** `packages/server/src/Interface.DocumentStore.ts` (`DocumentStoreDTO`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/document-stores/store`

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved all document stores.
    *   **Content (`application/json`):**
        *   Schema: Array of `DocumentStoreDTO` objects. Each DTO includes:
            *   `id` (string, uuid)
            *   `name` (string)
            *   `description` (string)
            *   `status` (string, enum: `EMPTY`, `SYNC`, `SYNCING`, `STALE`, `NEW`, `UPSERTED`, `FAILED`) (Note: `EMPTY_SYNC` in enum definition, likely just `EMPTY` in practice for DTO status)
            *   `totalChars` (number, sum of characters from all loaders)
            *   `totalChunks` (number, sum of chunks from all loaders)
            *   `whereUsed` (array of objects): `[{ id: string, name: string }]` (chatflows using this store)
            *   `vectorStoreConfig` (object, parsed JSON from entity, or null)
            *   `embeddingConfig` (object, parsed JSON from entity, or null)
            *   `recordManagerConfig` (object, parsed JSON from entity, or null)
            *   `loaders` (array of `IDocumentStoreLoader` objects): Each loader has details like `id`, `loaderId`, `loaderName`, `loaderConfig`, `splitterId`, `splitterName`, `splitterConfig`, `totalChunks`, `totalChars`, `status`, `files` (array of `IDocumentStoreLoaderFile`), `source` (derived), `credential`.
                *   `IDocumentStoreLoaderFile`: `{ id, name, mimePrefix, size, status, uploadedDate }`
            *   `createdDate` (string, date-time)
            *   `updatedDate` (string, date-time)
            *   *(Note: DTO class in `Interface.DocumentStore.ts` also declares `files`, `chunkOverlap`, `splitter`, `chunkSize` which are not populated by the `fromEntity` static method and thus may not be present or reliably populated in the response.)*
*   **`500 Internal Server Error`:**
    *   **Description:** Database or other server-side issue.
    *   **Content (`application/json`):** Schema `$ref: '#/components/schemas/ErrorResponse'`.

**Core Logic Summary:**
1. Controller calls service `getAllDocumentStores()`.
2. Service fetches all `DocumentStore` entities from the database.
3. Controller transforms the array of entities into an array of `DocumentStoreDTO` objects using `DocumentStoreDTO.fromEntities()`. This involves parsing JSON string fields from the entity (`loaders`, `whereUsed`, `vectorStoreConfig`, etc.) into objects/arrays, calculating `totalChars` and `totalChunks`, and adding a `source` string to each loader based on its configuration.
4. Returns the DTO array as JSON.
