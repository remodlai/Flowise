# Endpoint Analysis: GET /api/v1/document-stores/store/{id}

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreGetById`
**Description:** Retrieves a specific document store configuration by its ID. The `whereUsed` field in the response is populated with chatflow names in addition to IDs.

**Key Files:**
*   **Router:** `packages/server/src/routes/documentstore/index.ts`
*   **Controller:** `packages/server/src/controllers/documentstore/index.ts` (Handler: `getDocumentStoreById`)
*   **Service:** `packages/server/src/services/documentstore/index.ts` (Methods: `getDocumentStoreById`, `getUsedChatflowNames`)
*   **Entity:** `packages/server/src/database/entities/DocumentStore.ts`, `ChatFlow.ts` (for `getUsedChatflowNames`)
*   **DTO Definition:** `packages/server/src/Interface.DocumentStore.ts` (`DocumentStoreDTO`)

**Authentication:** Requires API Key.

**Request:**
*   **Method:** `GET`
*   **Path:** `/api/v1/document-stores/store/{id}`
*   **Path Parameters:**
    *   `id` (string, format: uuid, required): ID of the document store to retrieve.

**Responses:**

*   **`200 OK` (Success):**
    *   **Description:** Successfully retrieved the document store.
    *   **Content (`application/json`):**
        *   Schema: `DocumentStoreDTO` object (see previous `getAllDocumentStores` analysis for DTO structure). Specifically, `whereUsed` will be an array of `IDocumentStoreWhereUsed` objects (`{ id: string, name: string }`).
*   **`404 Not Found`:**
    *   **Description:** `DocumentStore` with the specified `id` not found.
*   **`412 Precondition Failed`:**
    *   **Description:** `id` (path parameter) not provided.
*   **`500 Internal Server Error`:**
    *   **Description:** Database or other server-side issue.

**Core Logic Summary:**
1. Controller validates `req.params.id`.
2. Calls service `getDocumentStoreById(id)` to fetch the raw `DocumentStore` entity.
3. If the entity has a `whereUsed` field (JSON string of chatflow IDs), calls service `getUsedChatflowNames()` to resolve IDs to names, then updates the entity's `whereUsed` with this enriched JSON string.
4. Transforms the (potentially modified) `DocumentStore` entity into a `DocumentStoreDTO` using `DocumentStoreDTO.fromEntity()`.
5. Returns the DTO as JSON.
