# Endpoint Analysis: POST /api/v1/document-stores/store

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreCreate`
**Description:** Creates a new document store configuration entry.

**Key Files:**
*   **Router:** `packages/server/src/routes/documentstore/index.ts`
*   **Controller:** `packages/server/src/controllers/documentstore/index.ts` (Handler: `createDocumentStore`)
*   **Service:** `packages/server/src/services/documentstore/index.ts` (Method: `createDocumentStore`)
*   **Entity:** `packages/server/src/database/entities/DocumentStore.ts`

**Authentication:** Requires API Key.

**Request Body (`application/json`):**
*   `name` (string, required): Name of the document store.
*   `description?` (string, optional): Description.
*   `loaders?` (string, optional): JSON string of loader configurations.
*   `vectorStoreConfig?` (string, optional): JSON string of vector store config.
*   `embeddingConfig?` (string, optional): JSON string of embedding config.
*   `recordManagerConfig?` (string, optional): JSON string of record manager config.
*   (status will default to `EMPTY`)

**Responses:**
*   **`200 OK`:** Returns the created `DocumentStore` entity.
*   **`400 Bad Request`:** If required fields like `name` are missing.
*   **`500 Internal Server Error`:** Database or other error.
