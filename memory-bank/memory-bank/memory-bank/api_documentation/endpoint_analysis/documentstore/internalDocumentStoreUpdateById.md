# Endpoint Analysis: PUT /api/v1/document-stores/store/{id}

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreUpdateById`
**Description:** Updates an existing document store configuration by its ID. Allows modification of fields like name, description, loaders, status, and various JSON configurations.

**Key Files:**
*   **Router:** `packages/server/src/routes/documentstore/index.ts`
*   **Controller:** `packages/server/src/controllers/documentstore/index.ts` (Handler: `updateDocumentStore`)
*   **Service:** `packages/server/src/services/documentstore/index.ts` (Method: `updateDocumentStore`)
*   **Entity:** `packages/server/src/database/entities/DocumentStore.ts`
*   **DTO Definition:** `packages/server/src/Interface.DocumentStore.ts` (`DocumentStoreDTO`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `PUT`
*   **Path:** `/api/v1/document-stores/store/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the document store to update.
*   **Headers:** `Content-Type: application/json`
*   **Request Body Schema (`application/json`):** (Partial `DocumentStore` entity fields)
    *   `name?` (string, optional)
    *   `description?` (string, optional)
    *   `loaders?` (string, optional, JSON array of loader configs)
    *   `status?` (string, enum from `DocumentStoreStatus`, optional)
    *   `vectorStoreConfig?` (string, optional, JSON object)
    *   `embeddingConfig?` (string, optional, JSON object)
    *   `recordManagerConfig?` (string, optional, JSON object)
    *   *(Note: `whereUsed` is system-managed. `id`, `createdDate`, `updatedDate` are not typically updated via request body.)*
*   **Example Request Body:**
    ```json
    {
      "name": "My Updated Project Store",
      "description": "Updated description.",
      "status": "STALE"
    }
    ```

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Document store updated successfully. Returns the updated `DocumentStoreDTO`.
    *   **Content (`application/json`):** Schema: `DocumentStoreDTO` object (see `getAllDocumentStores` analysis for DTO structure).
*   **`404 Not Found`:**
    *   **Description:** `DocumentStore` with the specified `id` not found.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (path parameter) or request body not provided.
*   **`500 Internal Server Error`:**
    *   **Description:** Database or other server-side issue.

**Core Logic Summary:**
1. Controller validates `req.params.id` and `req.body`.
2. Fetches existing `DocumentStore` entity by `id` (via service). Throws 404 if not found.
3. Creates a new `DocumentStore` instance and assigns `req.body` fields to it.
4. Calls service `updateDocumentStore`, passing both the fetched entity and the new entity with updates.
5. Service merges the update data into the fetched entity and saves it.
6. Controller transforms the returned (updated) entity into a `DocumentStoreDTO` and returns it.
