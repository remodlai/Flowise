# Endpoint Analysis: GET /api/v1/document-stores/store-configs/{id}/{loaderId}

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreGetConfigs`
**Description:** Retrieves specific configurations associated with a particular loader within a document store. This includes the loader's own configuration, its splitter's configuration (if any), and the parent document store's embedding, vector store, and record manager configurations. These configuration objects are returned as parsed JSON.

**Key Files:**
*   **Router:** `packages/server/src/routes/documentstore/index.ts`
*   **Controller:** `packages/server/src/controllers/documentstore/index.ts` (Handler: `getDocStoreConfigs`)
*   **Service:** `packages/server/src/services/documentstore/index.ts` (Method: `findDocStoreAvailableConfigs`)
*   **Entity:** `packages/server/src/database/entities/DocumentStore.ts`
*   **Schema Definition:** `api_documentation/schemas/modules/documentStoreSchemas.yaml` (for `DocumentStoreLoaderFullConfigResponse`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/document-stores/store-configs/{id}/{loaderId}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the Document Store.
    *   `loaderId` (string, required): ID of the specific loader configuration within the document store's `loaders` array.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the configurations.
    *   **Content (`application/json`):** Schema: `DocumentStoreLoaderFullConfigResponse` (defined in `documentStoreSchemas.yaml`). See schema definition for detailed properties.
*   **`404 Not Found`:**
    *   **Description:** `DocumentStore` or specific `loaderId` not found.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` or `loaderId` not provided.
*   **`500 Internal Server Error`:** Server-side issue.

**Core Logic Summary (`findDocStoreAvailableConfigs` service method):**
1. Fetches the `DocumentStore` entity by `id`.
2. Parses the `loaders` JSON string from the entity into an array of `IDocumentStoreLoader` objects.
3. Finds the specific loader object within this array that matches the given `loaderId`. Throws 404 if not found.
4. Constructs a response object:
    - Copies `loaderId` (component name, e.g., "pdfFile"), `loaderName` (display name), and `loaderConfig` (parsed object) from the found loader.
    - Copies `splitterId`, `splitterName`, and `splitterConfig` (parsed object) from the found loader, if they exist.
    - Parses and includes `embeddingConfig`, `vectorStoreConfig`, and `recordManagerConfig` from the parent `DocumentStore` entity.
5. Returns this aggregated configuration object.
