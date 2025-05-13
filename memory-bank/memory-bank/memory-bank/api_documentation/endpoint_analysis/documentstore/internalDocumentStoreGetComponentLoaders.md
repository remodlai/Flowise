# Endpoint Analysis: GET /api/v1/document-stores/components/loaders

**Module:** `documentstore`
**Operation ID:** `internalDocumentStoreGetComponentLoaders`
**Description:** Retrieves a list of all available document loader components (node definitions) that can be used within a document store. Some internal or utility loaders are filtered out.

**Key Files:**
*   Router: `routes/documentstore/index.ts`
*   Controller: `controllers/documentstore/index.ts` (Handler: `getDocumentLoaders`)
*   Service: `services/documentstore/index.ts` (Method: `getDocumentLoaders`)
*   Service (dependency): `services/nodes/index.ts` (Method: `getAllNodesForCategory`)
*   Schema Definition: `api_documentation/schemas/modules/documentStoreSchemas.yaml` (for `DocumentLoaderComponentDefinition`)

**Authentication:** Requires API Key.

**Request:**
*   Method: `GET`
*   Path: `/api/v1/document-stores/components/loaders`

**Responses:**

*   **`200 OK` (Success):**
    *   Description: Successfully retrieved document loader component definitions.
    *   Content (`application/json`):
        *   Schema: Array of `DocumentLoaderComponentDefinition` objects (defined in `documentStoreSchemas.yaml`, based on `INode` from `flowise-components`). Each object describes a loader component (its `name`, `label`, `description`, `inputs`, etc.).
*   **`500 Internal Server Error`:** Server-side issue.
    *   Content (`application/json`): Schema `$ref: '#/components/schemas/ErrorResponse'` (defined in `sharedSchemas.yaml` or similar).

**Core Logic Summary:**
1. Controller calls service `getDocumentLoaders()`.
2. Service calls `nodesService.getAllNodesForCategory('Document Loaders')`.
3. Filters out a predefined list of specific loader names (e.g., 'documentStore', 'vectorStoreToDocument').
4. Returns the array of remaining document loader node definitions (which are `INode` compatible structures).
