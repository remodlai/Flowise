# Endpoint Analysis: POST /api/v1/export-import/import

**Module:** `export-import`
**Operation ID:** `internalExportImportImportData`
**Description:** Imports Remodl Core data. Expects the same structure as produced by the export endpoint.

**Key Files:**
* Router: `routes/export-import/index.ts`
* Controller: `controllers/export-import/index.ts` (Handler: `importData`)
* Service: `services/export-import/index.ts` (Method: `importData`)

**Authentication:** Requires API Key.

**Request Body (`application/json`):**
*   Schema: Object with keys like `ChatFlows`, `Tools`, `Assistants`, `Credentials`, `Variables`, `ApiKeys`, `ChatMessages`, `ChatMessageFeedbacks`, each an array of the respective entities to import. This matches the export format.

**Responses:**
*   **`200 OK`:** Returns `{ status: 'success' }`.
*   **`400 Bad Request`:** If body is missing.
*   **`500 Internal Server Error`**
